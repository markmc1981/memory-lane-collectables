import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Memory Lane Collectables handles your information.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader kicker="Legal" title="Privacy" />
      <Container width="default">
        <div className="prose-warm py-14 text-sm">
          <p>
            A full privacy policy will be published here before launch. In
            short: we only collect the details needed to fulfil a reservation
            or answer an enquiry (name, contact details, postcode), we never
            take card payments online, and we don&rsquo;t sell your
            information to anyone.
          </p>
          <p>
            Questions in the meantime:{" "}
            <a
              href="mailto:hello@memorylanecollectables.co.uk"
              className="text-accent underline underline-offset-4"
            >
              hello@memorylanecollectables.co.uk
            </a>
            .
          </p>
        </div>
      </Container>
    </>
  );
}
