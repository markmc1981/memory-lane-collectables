import { createClient } from "@/lib/supabase/server";

/**
 * The only shape the public site is allowed to see. Every field here is
 * safe to show a customer — nothing about the clearance job, cost, holder
 * or storage location ever comes through this query.
 */
export type PublicProduct = {
  slug: string;
  meta_title: string;
  public_description: string;
  asking_price: number | null;
  currency: string;
  status: string;
  sold_at: string | null;
  category_name: string | null;
  primary_photo_path: string | null;
};

/**
 * Reads from the `public_products` view (see supabase/migrations), which
 * joins product_pages + stock_items + categories and exposes only the
 * public-safe columns. The app never queries stock_items directly from
 * a public route.
 */
export async function getPublicProducts(): Promise<PublicProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_products")
    .select(
      "slug, meta_title, public_description, asking_price, currency, status, sold_at, category_name, primary_photo_path"
    )
    .order("status", { ascending: true });

  if (error) {
    // Most likely cause while setting up: the migration hasn't been run
    // yet, or env vars aren't configured. Fail soft — show an empty
    // storefront rather than crashing the page.
    console.error("getPublicProducts failed:", error.message);
    return [];
  }

  return data ?? [];
}
