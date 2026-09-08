import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/ui/format";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select(
      "slug, meta_title, meta_description, public_description, asking_price, currency, status, sold_at, category_name, category_slug, primary_photo_path"
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
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const isSold = product.status === "sold";
  const isReserved = product.status === "reserved";

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
    <Container width="wide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="flex flex-wrap items-center gap-1.5 py-6 text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        {product.category_name && product.category_slug && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/category/${product.category_slug}`}
              className="hover:text-ink"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="text-ink-soft">{product.meta_title}</span>
      </nav>

      <div className="grid gap-10 pb-16 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-[4/5] rounded-lg bg-surface-sunk" />

        <div className="lg:pt-4">
          {product.category_name && (
            <p className="overline mb-2">{product.category_name}</p>
          )}
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {product.meta_title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            {isSold ? (
              <Badge tone="neutral">Sold</Badge>
            ) : isReserved ? (
              <Badge tone="highlight">Reserved</Badge>
            ) : (
              <span className="font-display text-2xl text-ink">
                {formatPrice(product.asking_price, product.currency)}
              </span>
            )}
          </div>

          <p className="prose-warm mt-6 whitespace-pre-line">
            {product.public_description}
          </p>

          <div className="mt-8">
            {isSold ? (
              <p className="text-sm text-muted">
                This piece has found a home.{" "}
                <Link
                  href="/"
                  className="text-accent underline underline-offset-4"
                >
                  See what else is available &rarr;
                </Link>
              </p>
            ) : (
              <>
                <Button
                  href={`/product/${product.slug}/reserve`}
                  size="lg"
                  fullWidth
                >
                  {isReserved ? "Join the waiting list" : "Reserve this item"}
                </Button>
                <p className="mt-3 text-xs text-muted">
                  Reserving holds the piece for 48 hours while we confirm
                  collection or delivery. No payment is taken online.
                </p>
              </>
            )}
          </div>

          <dl className="mt-10 border-t border-line-soft pt-6 text-sm">
            <div className="flex justify-between py-2">
              <dt className="text-muted">Condition</dt>
              <dd className="text-ink-soft">See description</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-ink-soft">Collection or courier</dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  );
}
