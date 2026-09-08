import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/ui/format";
import { createClient } from "@/lib/supabase/server";

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
          delivery for your area. {formatPrice(product.asking_price,
          product.currency)} — no payment is taken now.
        </p>

        {/* Phase 1f: this form is not wired up yet. The `reservations` table
            and its insert-only RLS policy already exist; the server action +
            confirmation email are the remaining work (MEMORYLANE_MASTER_PLAN
            §12 Phase 7). Left visible so the flow can be reviewed. */}
        <form className="mt-8 grid max-w-lg gap-4">
          <Field label="Your name" name="name" />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone (optional)" name="phone" type="tel" required={false} />
          <Field label="Postcode" name="postcode" />
          <fieldset className="text-sm">
            <legend className="mb-1.5 text-muted">Collection or delivery?</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="fulfilment" value="collection" defaultChecked />
                Collection
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="fulfilment" value="delivery" />
                Delivery
              </label>
            </div>
          </fieldset>
          <Button type="submit" size="lg" disabled>
            Reservation form coming soon
          </Button>
          <p className="text-xs text-muted">
            Not working yet — email{" "}
            <a
              href="mailto:hello@memorylanecollectables.co.uk"
              className="text-accent underline underline-offset-4"
            >
              hello@memorylanecollectables.co.uk
            </a>{" "}
            to reserve in the meantime.
          </p>
        </form>
      </div>
    </Container>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-10 w-full rounded border border-line bg-surface px-3 outline-none focus:border-ink"
      />
    </label>
  );
}
