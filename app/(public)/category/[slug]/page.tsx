import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { getProductsByCategory } from "@/lib/data/products";

type Props = { params: Promise<{ slug: string }> };

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = titleCase(slug);
  return {
    title: name,
    description: `Browse ${name.toLowerCase()} recovered from house clearances across Scotland, available now at Memory Lane Collectables.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const products = await getProductsByCategory(slug);
  const name = titleCase(slug);

  return (
    <Container width="wide">
      <header className="border-b border-line py-12">
        <p className="overline mb-2">Category</p>
        <h1 className="font-display text-4xl text-ink">{name}</h1>
      </header>

      <div className="py-12">
        {products.length === 0 ? (
          <EmptyState
            title={`No ${name.toLowerCase()} listed just now`}
            action={
              <Button href="/" variant="secondary" size="sm">
                Back to New Arrivals
              </Button>
            }
          >
            Stock moves quickly and new pieces are added after every clearance.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={{
                  slug: product.slug,
                  title: product.meta_title,
                  categoryName: product.category_name,
                  askingPrice: product.asking_price,
                  currency: product.currency,
                  status: product.status,
                  photoUrl: product.photo_url,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
