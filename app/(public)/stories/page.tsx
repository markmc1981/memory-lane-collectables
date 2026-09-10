import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "The Journal",
  description:
    "Guides to identifying vintage furniture, Scottish pottery, watches and collectables — and notes on the pieces we regenerate.",
};

export default function StoriesPage() {
  return (
    <>
      <PageHeader
        kicker="The Journal"
        title="Notes on the pieces we regenerate"
        lede="Short, practical guides to identifying makers, periods and marks — and the stories behind particular objects."
      />
      <Container width="default">
        <div className="py-14">
          {/* Editorial architecture is Phase 7. Articles will be MDX or a
              `stories` table — see MEMORYLANE_MASTER_PLAN.md §5. */}
          <EmptyState
            title="First articles coming soon"
            action={
              <Button href="/" variant="secondary" size="sm">
                Browse the shop
              </Button>
            }
          >
            We&rsquo;re writing up a few guides — reading pottery marks, why
            mid-century teak holds its value, and how we price against real sold
            comparables.
          </EmptyState>
        </div>
      </Container>
    </>
  );
}
