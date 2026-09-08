"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { nextClearanceReference, nextStockNumber, slugify } from "@/lib/refs";
import { getVisionProvider } from "@/lib/ai";
import { BUCKETS, copyToListingImages } from "@/lib/storage";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, userId: user.id };
}

// ---------------------------------------------------------------------------
// Create a clearance
// ---------------------------------------------------------------------------

export async function createClearance(formData: FormData) {
  const { supabase, userId } = await requireStaff();

  const name = String(formData.get("name") ?? "").trim();
  const town = String(formData.get("town") ?? "").trim();
  const collection_date =
    String(formData.get("collection_date") ?? "").trim() || null;

  if (!name || !town) {
    throw new Error("A clearance needs at least a name and a town.");
  }

  const reference = await nextClearanceReference(supabase);

  const { data, error } = await supabase
    .from("clearance_jobs")
    .insert({
      reference,
      job_number: name, // reuse the existing column for the internal name
      town,
      collection_date: collection_date ?? new Date().toISOString().slice(0, 10),
      created_by: userId,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  redirect(`/admin/clearances/${data.id}`);
}

// ---------------------------------------------------------------------------
// Record photos already uploaded to the clearance-media bucket by the browser
// ---------------------------------------------------------------------------

export async function recordUploadedMedia(
  clearanceId: string,
  files: { path: string; name: string }[]
) {
  const { supabase, userId } = await requireStaff();
  if (files.length === 0) return;

  const { error } = await supabase.from("clearance_media").insert(
    files.map((f) => ({
      clearance_id: clearanceId,
      kind: "photo" as const,
      storage_path: f.path,
      original_filename: f.name,
      processing_status: "uploaded" as const,
      uploaded_by: userId,
    }))
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clearances/${clearanceId}`);
}

// ---------------------------------------------------------------------------
// Run object detection over the clearance's photos
// ---------------------------------------------------------------------------

export async function runDetection(clearanceId: string) {
  const { supabase } = await requireStaff();

  const { data: media } = await supabase
    .from("clearance_media")
    .select("id, storage_path")
    .eq("clearance_id", clearanceId)
    .eq("kind", "photo");

  if (!media || media.length === 0) {
    throw new Error("Add some photos before running detection.");
  }

  // Signed URLs so the provider (a real one, later) can read the images.
  const photos = await Promise.all(
    media.map(async (m) => {
      const { data } = await supabase.storage
        .from("clearance-media")
        .createSignedUrl(m.storage_path, 600);
      return { mediaId: m.id, url: data?.signedUrl ?? "" };
    })
  );

  const { provider } = getVisionProvider();

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      type: "detect",
      subject_type: "clearance",
      subject_id: clearanceId,
      provider: provider.name,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (jobError) throw new Error(jobError.message);

  try {
    const result = await provider.detectObjects(photos);

    await supabase.from("ai_results").insert({
      ai_job_id: job.id,
      prompt_version: result.promptVersion,
      raw: result as unknown as Record<string, unknown>,
      evidence: { mediaIds: media.map((m) => m.id) },
    });

    // Each detected object becomes a candidate the team will review.
    const candidates = result.objects.map((o) => ({
      clearance_id: clearanceId,
      source_media_id: media[o.sourcePhotoIndex]?.id ?? media[0].id,
      bounding_box: o.boundingBox,
      label: o.label,
      category_guess: o.categoryGuess,
      confidence: o.confidence,
      quantity: o.quantity,
      risk_flags: o.riskFlags,
      suggested_asking_price: o.suggestedAskingPrice,
      status: "detected" as const,
    }));

    if (candidates.length > 0) {
      const { error: candError } = await supabase
        .from("candidate_items")
        .insert(candidates);
      if (candError) throw new Error(candError.message);
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        model: result.model,
        cost_pence: result.costPence,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await supabase
      .from("clearance_jobs")
      .update({ status: "processing" })
      .eq("id", clearanceId);
  } catch (err) {
    await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    throw err;
  }

  revalidatePath(`/admin/clearances/${clearanceId}`);
  redirect(`/admin/clearances/${clearanceId}/review`);
}

// ---------------------------------------------------------------------------
// Bulk review
// ---------------------------------------------------------------------------

type BulkAction = "ignore" | "needs_better_photo" | "reset";

export async function bulkReviewCandidates(
  clearanceId: string,
  candidateIds: string[],
  action: BulkAction
) {
  const { supabase, userId } = await requireStaff();
  if (candidateIds.length === 0) return;

  const status =
    action === "reset"
      ? "detected"
      : action === "ignore"
        ? "ignored"
        : "needs_better_photo";

  const { error } = await supabase
    .from("candidate_items")
    .update({
      status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .in("id", candidateIds);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clearances/${clearanceId}/review`);
}

// ---------------------------------------------------------------------------
// Identify a single candidate in depth
// ---------------------------------------------------------------------------

export async function identifyCandidate(candidateId: string) {
  const { supabase } = await requireStaff();

  const { data: candidate } = await supabase
    .from("candidate_items")
    .select(
      "id, clearance_id, label, source_media_id, clearance_media(storage_path)"
    )
    .eq("id", candidateId)
    .single();
  if (!candidate) throw new Error("Candidate not found.");

  const media = candidate.clearance_media as unknown as {
    storage_path: string;
  } | null;
  if (!media?.storage_path) {
    throw new Error("This candidate has no source photo to identify.");
  }

  const { data: signed } = await supabase.storage
    .from("clearance-media")
    .createSignedUrl(media.storage_path, 600);
  const photos = signed?.signedUrl
    ? [{ mediaId: candidate.source_media_id!, url: signed.signedUrl }]
    : [];

  const { provider } = getVisionProvider();

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .insert({
      type: "identify",
      subject_type: "candidate_item",
      subject_id: candidateId,
      provider: provider.name,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (jobError) throw new Error(jobError.message);

  try {
    const result = await provider.identifyItem(photos, candidate.label);

    await supabase.from("ai_results").insert({
      ai_job_id: job.id,
      prompt_version: result.promptVersion,
      confidence: result.identification.confidence,
      raw: result as unknown as Record<string, unknown>,
      evidence: { mediaIds: [candidate.source_media_id] },
    });

    await supabase
      .from("ai_jobs")
      .update({
        status: "succeeded",
        model: result.model,
        cost_pence: result.costPence,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Lift the identification's category and risk flags onto the candidate
    // so the review card reflects the deeper look.
    const patch: Record<string, unknown> = {
      risk_flags: result.identification.riskFlags,
    };
    if (result.identification.category) {
      patch.category_guess = result.identification.category;
    }
    await supabase.from("candidate_items").update(patch).eq("id", candidateId);
  } catch (err) {
    await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    throw err;
  }

  revalidatePath(`/admin/clearances/${candidate.clearance_id}/review`);
}

// ---------------------------------------------------------------------------
// Promote a candidate to a live product
// ---------------------------------------------------------------------------

export async function promoteCandidate(formData: FormData) {
  const { supabase, userId } = await requireStaff();

  const candidateId = String(formData.get("candidate_id"));
  const clearanceId = String(formData.get("clearance_id"));
  const title = String(formData.get("title") ?? "").trim();
  const askingPriceRaw = String(formData.get("asking_price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) throw new Error("Give the piece a title before listing it.");
  const asking_price = askingPriceRaw ? Number(askingPriceRaw) : null;
  if (askingPriceRaw && Number.isNaN(asking_price)) {
    throw new Error("Asking price must be a number.");
  }

  const { data: candidate } = await supabase
    .from("candidate_items")
    .select(
      "id, clearance_id, category_guess, risk_flags, source_media_id, clearance_media(storage_path)"
    )
    .eq("id", candidateId)
    .single();
  if (!candidate) throw new Error("Candidate not found.");

  // Match the AI's category guess to a real category row, if we have one.
  let category_id: string | null = null;
  if (candidate.category_guess) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", candidate.category_guess)
      .maybeSingle();
    category_id = cat?.id ?? null;
  }

  const stock_number = await nextStockNumber(supabase);

  const { data: stockItem, error: stockError } = await supabase
    .from("stock_items")
    .insert({
      stock_number,
      job_id: candidate.clearance_id,
      status: "listed",
      title,
      asking_price,
      currency: "GBP",
      category_id,
      risk_flags: candidate.risk_flags ?? [],
      promoted_from_candidate_id: candidate.id,
    })
    .select("id")
    .single();
  if (stockError) throw new Error(stockError.message);

  // Unique slug.
  let slug = slugify(title);
  const { data: clash } = await supabase
    .from("product_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) slug = `${slug}-${stock_number.toLowerCase()}`;

  const { error: pageError } = await supabase.from("product_pages").insert({
    stock_item_id: stockItem.id,
    slug,
    meta_title: title,
    meta_description: description.slice(0, 155) || title,
    public_description:
      description ||
      "Recovered during a house clearance in Scotland and selected for resale. Full condition details on request.",
    is_indexable: true,
  });
  if (pageError) throw new Error(pageError.message);

  // Carry the candidate's source photo onto the product so the storefront
  // has something to show. Copy into the public listing-images bucket; the
  // private original in clearance-media is kept.
  const sourceMedia = candidate.clearance_media as unknown as {
    storage_path: string;
  } | null;
  if (sourceMedia?.storage_path) {
    const ext = sourceMedia.storage_path.split(".").pop() ?? "jpg";
    const dest = `${stockItem.id}/primary.${ext}`;
    const copied = await copyToListingImages(
      supabase,
      BUCKETS.clearanceMedia,
      sourceMedia.storage_path,
      dest
    );
    if ("path" in copied) {
      await supabase.from("item_photos").insert({
        stock_item_id: stockItem.id,
        type: "listing",
        storage_path: copied.path,
        is_primary: true,
        alt_text: title,
        taken_by: userId,
      });
    }
  }

  await supabase
    .from("candidate_items")
    .update({
      status: "promoted",
      promoted_stock_item_id: stockItem.id,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", candidate.id);

  await supabase.from("activity_log").insert({
    stock_item_id: stockItem.id,
    event_type: "promoted_from_candidate",
    event_detail: { candidate_id: candidate.id, stock_number },
    actor: userId,
  });

  revalidatePath(`/admin/clearances/${clearanceId}/review`);
  redirect(`/admin/clearances/${clearanceId}/review`);
}
