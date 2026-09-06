import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select(
      "slug, meta_title, meta_description, public_description, asking_price, currency, status, sold_at, category_name, primary_photo_path"
    )
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  return {
    title: product.meta_title,
    description: product.meta_description ?? product.public_description,
    // Sold items with no remaining search value can be set noindex from
    // product_pages.is_indexable — that flag drives this, not deletion.
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const isSold = product.status === "sold";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.meta_title,
    description: product.public_description,
    category: product.category_name ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency ?? "GBP",
      price: product.asking_price ?? undefined,
      availability: isSold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="text-sm text-[var(--muted)] mb-6">
        <Link href="/">Browse</Link>
        {product.category_name && (
          <>
            {" "}
            /{" "}
            <Link href={`/category/${product.category_name}`}>
              {product.category_name}
            </Link>
          </>
        )}
        {" "}/ {product.meta_title}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-lg bg-[var(--line)]/40" />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-3">
            {product.meta_title}
          </h1>

          {isSold ? (
            <div className="mb-4">
              <span className="inline-block rounded-full bg-[var(--line)] px-3 py-1 text-sm">
                Sold
              </span>
              <p className="text-sm text-[var(--muted)] mt-2">
                This piece has found a home — take a look at what else is
                available.
              </p>
            </div>
          ) : (
            <p className="text-xl mb-4">
              {product.asking_price
                ? `£${product.asking_price.toFixed(2)}`
                : "Price on request"}
            </p>
          )}

          <p className="text-[var(--muted)] mb-8 whitespace-pre-line">
            {product.public_description}
          </p>

          {!isSold && (
            <button className="w-full rounded-md bg-[var(--accent)] text-[var(--accent-ink)] py-3 font-medium">
              Reserve this item
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
