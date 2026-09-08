import type { SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

export const BUCKETS = {
  clearanceMedia: "clearance-media",
  itemPhotos: "item-photos",
  listingImages: "listing-images",
} as const;

/**
 * A browser-usable URL for a file in the PUBLIC listing-images bucket.
 * (The other two buckets are private — use createSignedUrl for those.)
 */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${config.supabase.url}/storage/v1/object/public/${BUCKETS.listingImages}/${path}`;
}

/**
 * Copy an object from one bucket to another. Used when a candidate is
 * promoted: its source photo (private clearance-media) is copied into the
 * public listing-images bucket so the storefront can show it. The original
 * is always kept.
 */
export async function copyToListingImages(
  supabase: SupabaseClient,
  fromBucket: string,
  fromPath: string,
  toPath: string
): Promise<{ path: string } | { error: string }> {
  const { data, error } = await supabase.storage
    .from(fromBucket)
    .download(fromPath);
  if (error || !data) {
    return { error: error?.message ?? "Could not read the source image." };
  }

  const { error: upErr } = await supabase.storage
    .from(BUCKETS.listingImages)
    .upload(toPath, data, {
      contentType: data.type || "image/jpeg",
      upsert: true,
    });
  if (upErr) return { error: upErr.message };

  return { path: toPath };
}
