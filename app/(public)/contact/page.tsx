import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Memory Lane Collectables.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        kicker="Contact"
        title="Get in touch"
        lede="Questions about a piece, delivery, or something you'd like to sell — we're happy to help."
      />
      <Container width="default">
        <div className="py-14 text-sm">
          <dl className="divide-y divide-line-soft">
            <div className="flex justify-between py-4">
              <dt className="text-muted">Email</dt>
              <dd>
                <a
                  href="mailto:hello@memorylanecollectables.co.uk"
                  className="text-accent underline underline-offset-4"
                >
                  hello@memorylanecollectables.co.uk
                </a>
              </dd>
            </div>
            <div className="flex justify-between py-4">
              <dt className="text-muted">Area</dt>
              <dd className="text-ink-soft">Central Scotland, near Glasgow</dd>
            </div>
          </dl>
        </div>
      </Container>
    </>
  );
}
