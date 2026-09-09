import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/ui/format";
import { stripe } from "@/lib/stripe";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function BoughtPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let summary: {
    email: string | null;
    total: number | null;
    currency: string;
    courier: boolean;
  } | null = null;

  if (stripe && session_id) {
    try {
      const s = await stripe.checkout.sessions.retrieve(session_id);
      if (s.payment_status === "paid") {
        summary = {
          email: s.customer_details?.email ?? null,
          total: s.amount_total != null ? s.amount_total / 100 : null,
          currency: (s.currency ?? "gbp").toUpperCase(),
          courier: s.metadata?.fulfilment === "courier",
        };
      }
    } catch {
      // fall through to the generic thank-you
    }
  }

  return (
    <Container width="default">
      <div className="py-20 text-center">
        <p className="overline mb-3">Order confirmed</p>
        <h1 className="font-display text-3xl text-ink">Thank you</h1>

        {summary ? (
          <p className="prose-warm mx-auto mt-4 text-sm">
            Your payment of{" "}
            <strong>{formatPrice(summary.total, summary.currency)}</strong> went
            through. A receipt is on its way to{" "}
            {summary.email ?? "your email"}. We&rsquo;ll be in touch within a day
            to arrange {summary.courier ? "delivery" : "collection"}.
          </p>
        ) : (
          <p className="prose-warm mx-auto mt-4 text-sm">
            Your order is confirmed and we&rsquo;ll email you shortly with the
            details. If you don&rsquo;t hear from us, check your spam folder or
            get in touch.
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/shop"
            className="text-sm text-accent underline underline-offset-4"
          >
            Keep browsing &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
