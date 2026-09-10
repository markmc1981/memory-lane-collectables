"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVisionProvider } from "@/lib/ai";
import { nextStockNumber, slugify } from "@/lib/refs";
import { publicImageUrl } from "@/lib/storage";
import type { Identification } from "@/lib/ai/types";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return { supabase, userId: user.id };
}

export type ItemDraft = {
  title: string;
  description: string;
  category: string | null;
  suggestedPrice: number | null;
  identification: Identification | null;
  costPence: number;
};

/**
 * Look at the photos of one item (already uploaded to listing-images) and
 * return a listing draft — identify, then write the copy. Creates nothing.
 */
export async function analyseNewItem(paths: string[]): Promise<ItemDraft> {
  const { supabase } = await requireStaff();
  if (paths.length === 0) throw new Error("Add at least one photo.");

  const photos = paths.map((p, i) => ({
    mediaId: `new-${i}`,
    url: publicImageUrl(p) ?? "",
  }));

  const { provider } = getVisionProvider();

  // 1 · identify the item directly (single-item mode — no separate detect pass)
  const idResult = await provider.identifyItem(photos, null);
  const id = idResult.identification;
  const label = id.itemType ?? id.summary.split(".")[0] ?? "Item";

  // 2 · write the listing from the identification
  const listing = await provider.writeListing({
    label,
    identification: id,
    askingPrice: id.suggestedAskingPrice,
  });

  const costPence = (idResult.costPence ?? 0) + (listing.costPence ?? 0);

  // Log the three calls against a throwaway subject id for the audit trail.
  await supabase.from("ai_jobs").insert({
    type: "identify",
    subject_type: "direct_item",
    subject_id: "00000000-0000-0000-0000-000000000000",
    provider: provider.name,
    model: idResult.model,
    status: "succeeded",
    cost_pence: costPence,
    finished_at: new Date().toISOString(),
  });

  return {
    title: listing.draft.title || label,
    description: listing.draft.description,
    category: id.category ?? null,
    suggestedPrice: id.suggestedAskingPrice,
    identification: id,
    costPence,
  };
}

/**
 * Publish a direct item: mint the SKU, create the product + page, attach the
 * photos, mark it listed. No clearance involved.
 */
export async function publishNewItem(formData: FormData) {
  const { supabase, userId } = await requireStaff();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Give the item a title.");

  const description = String(formData.get("description") ?? "").trim();
  const askingRaw = String(formData.get("asking_price") ?? "").trim();
  const asking_price = askingRaw ? Number(askingRaw) : null;
  if (askingRaw && !Number.isFinite(asking_price)) {
    throw new Error("Asking price must be a number.");
  }
  const courierRaw = String(formData.get("courier_price") ?? "").trim();
  const courier_price = courierRaw ? Number(courierRaw) : null;

  const categoryName = String(formData.get("category") ?? "").trim();
  const maker = String(formData.get("maker") ?? "").trim() || null;
  const era = String(formData.get("era") ?? "").trim() || null;
  const material = String(formData.get("material") ?? "").trim() || null;
  const condition_notes =
    String(formData.get("condition_notes") ?? "").trim() || null;
  const paths = formData.getAll("photo_path").map(String).filter(Boolean);

  let category_id: string | null = null;
  if (categoryName) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", categoryName)
      .maybeSingle();
    if (cat) category_id = cat.id;
    else {
      const { data: made } = await supabase
        .from("categories")
        .insert({ name: categoryName, slug: slugify(categoryName) })
        .select("id")
        .single();
      category_id = made?.id ?? null;
    }
  }

  const stock_number = await nextStockNumber(supabase);

  const { data: item, error: itemErr } = await supabase
    .from("stock_items")
    .insert({
      stock_number,
      status: "listed",
      title,
      asking_price,
      courier_price,
      currency: "GBP",
      category_id,
      maker,
      era,
      material,
      condition_notes,
    })
    .select("id")
    .single();
  if (itemErr) throw new Error(itemErr.message);

  let slug = slugify(title);
  const { data: clash } = await supabase
    .from("product_pages")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) slug = `${slug}-${stock_number.toLowerCase()}`;

  const { error: pageErr } = await supabase.from("product_pages").insert({
    stock_item_id: item.id,
    slug,
    meta_title: title,
    meta_description: (description || title).slice(0, 155),
    public_description:
      description ||
      "Regenerated by Memory Lane and ready for its next chapter. A full condition report is available on request.",
    is_indexable: true,
  });
  if (pageErr) throw new Error(pageErr.message);

  if (paths.length > 0) {
    await supabase.from("item_photos").insert(
      paths.map((p, i) => ({
        stock_item_id: item.id,
        type: "listing" as const,
        storage_path: p,
        is_primary: i === 0,
        alt_text: title,
        taken_by: userId,
      }))
    );
  }

  await supabase.from("activity_log").insert({
    stock_item_id: item.id,
    event_type: "listed_direct",
    event_detail: { stock_number },
    actor: userId,
  });

  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${item.id}`);
}
