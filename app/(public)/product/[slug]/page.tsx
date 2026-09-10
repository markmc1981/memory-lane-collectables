import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ui/product-card";
import { publicImageUrl } from "@/lib/storage";
import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { BuyBox } from "./buy-box";

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select(
      "slug, meta_title, meta_description, subtitle, public_description, asking_price, currency, status, sold_at, courier_price, delivery_note, maker, era, material, dimensions, condition_notes, category_name, category_slug, primary_photo_path"
    )
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getRelated(categorySlug: string | null, excludeSlug: string) {
  const supabase = await createClient();
  let q = supabase
    .from("public_products")
    .select("slug, meta_title, asking_price, currency, status, category_name, primary_photo_path")
    .neq("slug", excludeSlug)
    .eq("status", "listed")
    .limit(4);
  if (categorySlug) q = q.eq("category_slug", categorySlug);
  const { data } = await q;
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const photo = publicImageUrl(product.primary_photo_path);
  return {
    title: product.meta_title,
    description: product.meta_description ?? product.public_description,
    openGraph: photo ? { images: [photo] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const isSold = product.status === "sold";
  const isReserved = product.status === "reserved";
  const photoUrl = publicImageUrl(product.primary_photo_path);
  const related = await getRelated(product.category_slug, slug);

  const dims = product.dimensions as Record<string, string | number> | null;
  const details: [string, string | null][] = [
    ["Maker", product.maker],
    ["Era", product.era],
    ["Material", product.material],
    [
      "Dimensions",
      dims
        ? Object.entries(dims)
            .map(([k, v]) => `${k} ${v}`)
            .join(" · ")
        : null,
    ],
    ["Category", product.category_name],
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.meta_title,
    description: product.public_description,
    image: photoUrl ?? undefined,
    category: product.category_name ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency ?? "GBP",
      price: product.asking_price ?? undefined,
      availability: isSold
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: `${config.site.url}/product/${slug}`,
    },
  };

  return (
    <Container width="wide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="flex flex-wrap items-center gap-1.5 py-6 text-sm text-muted">
        <Link href="/shop" className="hover:text-ink">
          Shop
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

      <div className="grid gap-10 pb-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="overflow-hidden rounded-lg bg-surface-sunk">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={product.meta_title}
              className="w-full object-cover"
            />
          ) : (
            <div className="aspect-[4/5]" />
          )}
        </div>

        <div>
          {product.category_name && (
            <p className="overline mb-2">{product.category_name}</p>
          )}
          <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
            {product.meta_title}
          </h1>
          {product.subtitle && (
            <p className="mt-1 text-ink-soft">{product.subtitle}</p>
          )}

          <Link
            href="/regenerated"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent-tint/50 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-accent-dark transition-colors hover:border-accent"
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
            />
            Regenerated by Memory Lane
          </Link>

          <div className="mt-5">
            {isSold ? (
              <div className="rounded-lg border border-line bg-surface p-5">
                <Badge tone="neutral">Sold</Badge>
                <p className="mt-2 text-sm text-muted">
                  This piece has found a home.{" "}
                  <Link
                    href="/shop"
                    className="text-accent underline underline-offset-4"
                  >
                    See what else is available &rarr;
                  </Link>
                </p>
              </div>
            ) : isReserved ? (
              <div className="rounded-lg border border-line bg-surface p-5">
                <Badge tone="highlight">Reserved</Badge>
                <p className="mt-2 text-sm text-muted">
                  Currently on hold for another customer.{" "}
                  <Link
                    href={`/product/${slug}/reserve`}
                    className="text-accent underline underline-offset-4"
                  >
                    Join the waiting list
                  </Link>
                </p>
              </div>
            ) : (
              <BuyBox
                slug={slug}
                price={product.asking_price}
                currency={product.currency ?? "GBP"}
                courierPrice={product.courier_price}
                deliveryNote={product.delivery_note}
                checkoutEnabled={config.stripe.enabled}
              />
            )}
          </div>

          {details.some(([, v]) => v) && (
            <dl className="mt-8 divide-y divide-line-soft border-y border-line-soft text-sm">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right text-ink-soft">{v}</dd>
                  </div>
                ))}
            </dl>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid gap-10 border-t border-line py-12 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <h2 className="font-display text-xl text-ink">About this piece</h2>
          <p className="prose-warm mt-3 whitespace-pre-line">
            {product.public_description}
          </p>
        </div>
        {product.condition_notes && (
          <div>
            <h2 className="font-display text-xl text-ink">Condition</h2>
            <p className="prose-warm mt-3 whitespace-pre-line">
              {product.condition_notes}
            </p>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="border-t border-line py-12">
          <h2 className="mb-6 font-display text-xl text-ink">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.slug}
                product={{
                  slug: r.slug,
                  title: r.meta_title,
                  categoryName: r.category_name,
                  askingPrice: r.asking_price,
                  currency: r.currency,
                  status: r.status,
                  photoUrl: publicImageUrl(r.primary_photo_path),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
