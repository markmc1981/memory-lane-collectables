import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/storage";

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
  category_slug: string | null;
  /** Ready-to-use public image URL, or null. */
  photo_url: string | null;
};

const COLUMNS =
  "slug, meta_title, public_description, asking_price, currency, status, sold_at, category_name, category_slug, primary_photo_path";

function mapRow(row: {
  slug: string;
  meta_title: string;
  public_description: string;
  asking_price: number | null;
  currency: string | null;
  status: string | null;
  sold_at: string | null;
  category_name: string | null;
  category_slug: string | null;
  primary_photo_path: string | null;
}): PublicProduct {
  return {
    slug: row.slug,
    meta_title: row.meta_title,
    public_description: row.public_description,
    asking_price: row.asking_price,
    currency: row.currency ?? "GBP",
    status: row.status ?? "listed",
    sold_at: row.sold_at,
    category_name: row.category_name,
    category_slug: row.category_slug,
    photo_url: publicImageUrl(row.primary_photo_path),
  };
}

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
    .select(COLUMNS)
    .eq("status", "listed")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getPublicProducts failed:", error.message);
    return [];
  }

  return (data ?? []).map(mapRow);
}

export async function getProductsByCategory(
  slug: string
): Promise<PublicProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_products")
    .select(COLUMNS)
    .eq("category_slug", slug);

  if (error) {
    console.error("getProductsByCategory failed:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}
