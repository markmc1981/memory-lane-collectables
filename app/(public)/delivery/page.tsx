import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "Delivery & Collection",
  description:
    "How collection and delivery work for Memory Lane Collectables — from small parcels to furniture across central Scotland.",
};

const options = [
  {
    t: "Collection",
    d: "Arrange a time to collect from us near Glasgow. Free, and the easiest option for larger pieces.",
  },
  {
    t: "Local delivery",
    d: "For furniture and bulky items within central Scotland, we can usually deliver ourselves for a set fee based on distance.",
  },
  {
    t: "Courier",
    d: "Smaller items go by tracked courier, packed properly. The cost is shown before you reserve.",
  },
];

export default function DeliveryPage() {
  return (
    <>
      <PageHeader
        kicker="Delivery & Collection"
        title="Getting it to you"
        lede="No payment is taken online. Once you reserve a piece we confirm the options and price for your postcode, then arrange payment on collection or before dispatch."
      />
      <Container width="default">
        <div className="divide-y divide-line-soft py-8">
          {options.map((o) => (
            <div key={o.t} className="py-6">
              <h2 className="font-display text-xl text-ink">{o.t}</h2>
              <p className="prose-warm mt-2 text-sm">{o.d}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
