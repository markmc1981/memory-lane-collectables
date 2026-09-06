import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function getCategoryProducts(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select("slug, meta_title, asking_price, currency, status, category_name")
    .eq("category_slug", slug);

  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ");
  return {
    title: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    description: `Browse ${name} recovered from Scottish house clearances, available now at Memory Lane Collectables.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const products = await getCategoryProducts(slug);
  const name = slug.replace(/-/g, " ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight mb-8 capitalize">
        {name}
      </h1>

      {products.length === 0 ? (
        <p className="text-[var(--muted)]">Nothing in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/product/${product.slug}`}
              className="rounded-lg border border-[var(--line)] overflow-hidden"
            >
              <div className="aspect-square bg-[var(--line)]/40" />
              <div className="p-4">
                <h2 className="font-medium">{product.meta_title}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {product.status === "sold"
                    ? "Sold"
                    : product.asking_price
                    ? `£${product.asking_price.toFixed(2)}`
                    : "Price on request"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
