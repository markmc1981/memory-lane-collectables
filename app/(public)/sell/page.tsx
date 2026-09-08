import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Sell to Memory Lane",
  description:
    "Have vintage furniture, collectables, watches or antiques to sell? Send us a few photos and we'll tell you if it's something we can take on.",
};

export default function SellPage() {
  return (
    <>
      <PageHeader
        kicker="Sell to Us"
        title="Something you think we&rsquo;d like?"
        lede="We buy interesting single pieces and whole collections — furniture, ceramics, watches, jewellery, art, curios. Send a few photos and a line about it."
      />

      <Container width="default">
        <div className="py-14">
          {/* Phase 1: this is a holding page. The real submission flow
              (photo upload -> AI triage -> staff response) is Phase 7 in
              MEMORYLANE_MASTER_PLAN.md. Until then, point people at email. */}
          <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">
            <h2 className="font-display text-xl text-ink">
              While our upload form is being built
            </h2>
            <p className="prose-warm mt-3 text-sm">
              Email a few clear photos and rough dimensions to{" "}
              <a
                href="mailto:hello@memorylanecollectables.co.uk"
                className="text-accent underline underline-offset-4"
              >
                hello@memorylanecollectables.co.uk
              </a>{" "}
              and we&rsquo;ll come back to you with one of: we&rsquo;re
              interested, we need more information, it&rsquo;s not quite for us,
              or let&rsquo;s arrange a valuation.
            </p>
            <div className="mt-5">
              <Button href="mailto:hello@memorylanecollectables.co.uk">
                Email us about an item
              </Button>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted">
            We never make a binding offer from photos alone — anything we say at
            this stage is an indication, subject to seeing the piece.
          </p>
        </div>
      </Container>
    </>
  );
}
