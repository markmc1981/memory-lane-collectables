"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/storage";
import type { StockStatus } from "./statuses";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return { supabase, userId: user.id };
}

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function updateProduct(formData: FormData) {
  const { supabase, userId } = await requireStaff();
  const id = String(formData.get("id"));

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title can't be empty.");

  const stockPatch = {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    asking_price: num(formData.get("asking_price")),
    minimum_acceptable_price: num(formData.get("minimum_acceptable_price")),
    quick_sale_price: num(formData.get("quick_sale_price")),
    courier_price: num(formData.get("courier_price")),
    delivery_note: String(formData.get("delivery_note") ?? "").trim() || null,
    maker: String(formData.get("maker") ?? "").trim() || null,
    era: String(formData.get("era") ?? "").trim() || null,
    material: String(formData.get("material") ?? "").trim() || null,
    condition_notes: String(formData.get("condition_notes") ?? "").trim() || null,
    storage_location: String(formData.get("storage_location") ?? "").trim() || null,
  };

  const { error: e1 } = await supabase
    .from("stock_items")
    .update(stockPatch)
    .eq("id", id);
  if (e1) throw new Error(e1.message);

  const description = String(formData.get("description") ?? "").trim();
  const { error: e2 } = await supabase
    .from("product_pages")
    .update({
      meta_title: title,
      meta_description: description.slice(0, 155) || title,
      public_description: description || "Details on request.",
    })
    .eq("stock_item_id", id);
  if (e2) throw new Error(e2.message);

  await supabase.from("activity_log").insert({
    stock_item_id: id,
    event_type: "product_edited",
    actor: userId,
  });

  revalidatePath(`/admin/inventory/${id}`);
  revalidatePath("/admin/inventory");
}

export async function setProductStatus(id: string, status: StockStatus) {
  const { supabase, userId } = await requireStaff();

  const patch: Record<string, unknown> = { status };
  const { error } = await supabase
    .from("stock_items")
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (status === "sold") {
    await supabase
      .from("product_pages")
      .update({ sold_at: new Date().toISOString() })
      .eq("stock_item_id", id);
  }

  await supabase.from("activity_log").insert({
    stock_item_id: id,
    event_type: "status_changed",
    event_detail: { to: status },
    actor: userId,
  });

  revalidatePath(`/admin/inventory/${id}`);
  revalidatePath("/admin/inventory");
}

/** Record extra photos uploaded straight to the public listing-images bucket. */
export async function addProductPhotos(
  stockItemId: string,
  files: { path: string }[]
) {
  const { supabase, userId } = await requireStaff();
  if (files.length === 0) return;

  const { count } = await supabase
    .from("item_photos")
    .select("id", { count: "exact", head: true })
    .eq("stock_item_id", stockItemId);

  const { error } = await supabase.from("item_photos").insert(
    files.map((f, i) => ({
      stock_item_id: stockItemId,
      type: "listing" as const,
      storage_path: f.path,
      is_primary: (count ?? 0) === 0 && i === 0,
      taken_by: userId,
    }))
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/inventory/${stockItemId}`);
}

/**
 * Record an AI-enhanced photo (item cut out onto a studio backdrop). The
 * blob is uploaded to listing-images by the client; here we just add the
 * row, make it primary, and link it to the original it was made from.
 */
export async function addEnhancedPhoto(
  stockItemId: string,
  path: string,
  originalPhotoId: string
) {
  const { supabase, userId } = await requireStaff();

  await supabase
    .from("item_photos")
    .update({ is_primary: false })
    .eq("stock_item_id", stockItemId);

  const { error } = await supabase.from("item_photos").insert({
    stock_item_id: stockItemId,
    type: "ai_edited",
    storage_path: path,
    is_primary: true,
    original_photo_id: originalPhotoId,
    taken_by: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/inventory/${stockItemId}`);
}

export async function setPrimaryPhoto(stockItemId: string, photoId: string) {
  const { supabase } = await requireStaff();
  await supabase
    .from("item_photos")
    .update({ is_primary: false })
    .eq("stock_item_id", stockItemId);
  const { error } = await supabase
    .from("item_photos")
    .update({ is_primary: true })
    .eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/inventory/${stockItemId}`);
}

export async function deletePhoto(stockItemId: string, photoId: string, path: string) {
  const { supabase } = await requireStaff();
  await supabase.storage.from(BUCKETS.listingImages).remove([path]);
  const { error } = await supabase.from("item_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/inventory/${stockItemId}`);
}
