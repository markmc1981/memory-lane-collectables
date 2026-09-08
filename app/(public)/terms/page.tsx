import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of sale for Memory Lane Collectables.",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <>
      <PageHeader kicker="Legal" title="Terms of sale" />
      <Container width="default">
        <div className="prose-warm py-14 text-sm">
          <p>
            Full terms will be published here before launch. The essentials:
            items are used and sold as described, with condition noted and
            photographed as honestly as we can manage. Reserving an item holds
            it for 48 hours; no payment is taken online. If a piece arrives not
            as described, tell us and we&rsquo;ll put it right.
          </p>
        </div>
      </Container>
    </>
  );
}
