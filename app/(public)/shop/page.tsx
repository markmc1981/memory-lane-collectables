import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { publicImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { ShopControls } from "./shop-controls";

type Props = {
  searchParams: Promise<{
    category?: string;
    min?: string;
    max?: string;
    sort?: string;
    q?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Browse every vintage, antique and collectable piece currently available at Memory Lane Collectables — furniture, ceramics, art, lighting and more, each one regenerated and ready for its next chapter.",
};

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .order("name");

  let query = supabase
    .from("public_products")
    .select(
      "slug, meta_title, asking_price, currency, status, category_name, category_slug, primary_photo_path, updated_at"
    )
    .eq("status", "listed");

  if (sp.category) query = query.eq("category_slug", sp.category);
  if (sp.min) query = query.gte("asking_price", Number(sp.min));
  if (sp.max) query = query.lte("asking_price", Number(sp.max));
  if (sp.q) query = query.ilike("meta_title", `%${sp.q}%`);

  if (sp.sort === "price-asc")
    query = query.order("asking_price", { ascending: true, nullsFirst: false });
  else if (sp.sort === "price-desc")
    query = query.order("asking_price", { ascending: false, nullsFirst: false });
  else query = query.order("updated_at", { ascending: false });

  const { data: products } = await query;
  const list = products ?? [];

  return (
    <Container width="wide">
      <header className="border-b border-line py-10">
        <p className="overline mb-2">Shop</p>
        <h1 className="font-display text-4xl text-ink">
          {sp.q ? `“${sp.q}”` : "Everything available"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {list.length} {list.length === 1 ? "piece" : "pieces"}
        </p>
      </header>

      <div className="grid gap-10 py-10 lg:grid-cols-[200px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ShopControls categories={categories ?? []} />
        </aside>

        <div>
          {list.length === 0 ? (
            <EmptyState
              title="Nothing matches those filters"
              action={
                <Button href="/shop" variant="secondary" size="sm">
                  Clear filters
                </Button>
              }
            >
              Try widening the price range or picking a different category.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
              {list.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={{
                    slug: p.slug,
                    title: p.meta_title,
                    categoryName: p.category_name,
                    askingPrice: p.asking_price,
                    currency: p.currency,
                    status: p.status,
                    photoUrl: publicImageUrl(p.primary_photo_path),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
