import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/ui/format";
import { createClient } from "@/lib/supabase/server";
import { ReserveForm } from "./reserve-form";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Reserve an item",
  robots: { index: false },
};

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_products")
    .select("slug, meta_title, asking_price, currency, status")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export default async function ReservePage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  if (product.status === "sold") {
    return (
      <Container width="default">
        <div className="py-16">
          <h1 className="font-display text-2xl text-ink">
            {product.meta_title} has sold
          </h1>
          <p className="prose-warm mt-3 text-sm">
            <Link
              href="/"
              className="text-accent underline underline-offset-4"
            >
              See what else is available &rarr;
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container width="default">
      <div className="py-12">
        <Link
          href={`/product/${slug}`}
          className="text-sm text-muted hover:text-ink"
        >
          &larr; Back to item
        </Link>

        <h1 className="font-display mt-4 text-3xl text-ink">
          Reserve &ldquo;{product.meta_title}&rdquo;
        </h1>
        <p className="prose-warm mt-3 text-sm">
          This holds the piece for 48 hours while we confirm collection or
          delivery for your area.{" "}
          {formatPrice(product.asking_price, product.currency)} — no payment is
          taken now.
        </p>

        <ReserveForm slug={slug} />
      </div>
    </Container>
  );
}
