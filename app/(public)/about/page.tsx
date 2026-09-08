import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/site/page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "Memory Lane Collectables rescues interesting vintage and collectable pieces from house clearances across Scotland and gives them another life.",
};

const steps = [
  {
    n: "01",
    t: "We clear a house",
    d: "Through Ceemac Removals & Clearances, we empty homes across central Scotland. Most of what comes out is ordinary. Some of it isn't.",
  },
  {
    n: "02",
    t: "We look properly",
    d: "Every piece with any interest is set aside, photographed, and researched — maker, age, materials, condition. Nothing is guessed at or dressed up.",
  },
  {
    n: "03",
    t: "We pass it on",
    d: "It's cleaned, priced fairly against what similar pieces actually sell for, and listed here for someone who'll use it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        kicker="About"
        title="Objects with a story"
        lede="Memory Lane Collectables is the resale side of a Scottish house-clearance business. We find things worth keeping and make sure they don't end up in a skip."
      />
      <Container width="default">
        <div className="grid gap-10 py-14 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="font-display text-2xl text-accent">{s.n}</p>
              <h2 className="font-display mt-2 text-xl text-ink">{s.t}</h2>
              <p className="prose-warm mt-2 text-sm">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-line py-14">
          <h2 className="font-display text-2xl text-ink">
            Honest about condition
          </h2>
          <p className="prose-warm mt-3">
            These are used pieces, often decades old. We photograph marks and
            wear rather than hide them, and we&rsquo;d always rather you knew
            exactly what you were buying. If a description isn&rsquo;t clear
            enough, ask us.
          </p>
        </div>
      </Container>

      {/* Draft holding content — replace with Mark's copy before launch. */}
    </>
  );
}
