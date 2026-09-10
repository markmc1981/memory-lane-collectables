import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/storage";

type Props = { params: Promise<{ slug: string }> };

const COLLECTIONS: Record<string, { title: string; blurb: string }> = {
  scottish: {
    title: "The Scottish Collection",
    blurb:
      "Pieces with a Scottish story — makers, materials and design from Scotland, ready for another chapter.",
  },
  "mid-century": {
    title: "Mid-Century Finds",
    blurb: "Clean lines and honest materials from the 1950s to the 1970s.",
  },
  "under-100": {
    title: "Under £100",
    blurb: "Characterful pieces that won't break the bank.",
  },
  "one-of-a-kind": {
    title: "One of a Kind",
    blurb: "Everything here exists once. When it's gone, it's gone.",
  },
  "new-this-week": {
    title: "New This Week",
    blurb: "The latest pieces to be regenerated and listed.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = COLLECTIONS[slug];
  return c ? { title: c.title, description: c.blurb } : { title: "Collection" };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = COLLECTIONS[slug];
  if (!c) notFound();

  const supabase = await createClient();
  const cols =
    "slug, meta_title, asking_price, currency, status, category_name, primary_photo_path, era, public_description, updated_at";

  let query = supabase
    .from("public_products")
    .select(cols)
    .eq("status", "listed");

  if (slug === "scottish") {
    query = query.or(
      "meta_title.ilike.%scottish%,meta_title.ilike.%glasgow%,meta_title.ilike.%edinburgh%,public_description.ilike.%scotland%,public_description.ilike.%scottish%"
    );
  } else if (slug === "mid-century") {
    query = query.or(
      "meta_title.ilike.%mid-century%,meta_title.ilike.%teak%,era.ilike.%196%,era.ilike.%197%"
    );
  } else if (slug === "under-100") {
    query = query.lte("asking_price", 100);
  } else {
    query = query.order("updated_at", { ascending: false }).limit(24);
  }

  const { data } = await query;
  const products = data ?? [];

  return (
    <>
      <section className="border-b border-paper-line bg-paper-dim py-14">
        <Container width="wide">
          <p className="overline mb-2">Collection</p>
          <h1 className="font-display text-4xl text-ink">{c.title}</h1>
          <p className="prose-warm mt-3">{c.blurb}</p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container width="wide">
          {products.length === 0 ? (
            <EmptyState
              title="Nothing in this collection just now"
              action={
                <Button href="/shop" variant="secondary" size="sm">
                  Browse everything
                </Button>
              }
            >
              New pieces are added every week — check back soon.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
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
        </Container>
      </section>
    </>
  );
}
