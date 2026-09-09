import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Reservation received",
  robots: { index: false },
};

export default function ReservationDonePage() {
  return (
    <Container width="default">
      <div className="py-20 text-center">
        <p className="overline mb-3">Reservation received</p>
        <h1 className="font-display text-3xl text-ink">
          Thank you — we&rsquo;ve got it
        </h1>
        <p className="prose-warm mx-auto mt-4 text-sm">
          The piece is held for you for 48 hours. We&rsquo;ll email you within a
          day to confirm collection or delivery and sort out payment. If you
          don&rsquo;t hear from us, check your spam folder or get in touch.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-accent underline underline-offset-4"
          >
            Keep browsing &rarr;
          </Link>
        </div>
      </div>
    </Container>
  );
}
