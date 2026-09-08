import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://memorylanecollectables.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("public_products")
    .select("slug, updated_at")
    .eq("is_indexable", true);

  const { data: categories } = await supabase
    .from("categories")
    .select("slug");

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at ?? undefined,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map(
    (c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
    })
  );

  return [{ url: SITE_URL }, ...categoryEntries, ...productEntries];
}
