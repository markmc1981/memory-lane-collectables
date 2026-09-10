import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Memory Lane Collectables gives remarkable objects another life — identifying, researching and regenerating furniture, antiques and collectables, and returning them to circulation.",
};

const steps = [
  {
    n: "01",
    t: "Discover",
    d: "We find remarkable pieces before they leave circulation — the ones with character, craft or design value worth preserving.",
  },
  {
    n: "02",
    t: "Identify",
    d: "Maker, period, materials and marks are researched and recorded. Where we can't verify something, we say so — nothing is dressed up.",
  },
  {
    n: "03",
    t: "Regenerate",
    d: "Each piece is cleaned, assessed, photographed properly and catalogued with an honest condition report, then priced against real sold comparables.",
  },
  {
    n: "04",
    t: "Recirculate",
    d: "It's passed on to someone who'll appreciate it again — in Scotland, and increasingly around the world.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink text-paper ink-texture">
        <Container width="wide">
          <div className="max-w-2xl py-16 sm:py-24">
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-accent">
              Our Story
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">
              Giving remarkable objects another life
            </h1>
            <p className="mt-5 text-lg text-paper/80">
              Thousands of beautiful, useful and historically interesting pieces
              disappear from circulation every year. Memory Lane finds the ones
              worth preserving, regenerates them, and connects them with people
              who will value them again.
            </p>
          </div>
        </Container>
      </section>

      <Container width="wide">
        <div className="grid gap-10 py-16 sm:grid-cols-2 sm:py-20 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="font-display text-3xl text-accent">{s.n}</p>
              <h2 className="font-display mt-2 text-xl text-ink">{s.t}</h2>
              <p className="prose-warm mt-2 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </Container>

      <section className="border-y border-paper-line bg-paper-dim py-16 sm:py-20">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Honest about condition
              </h2>
              <p className="prose-warm mt-3">
                These are pieces with a past — often decades or more than a
                century old. We photograph the marks and the wear rather than
                hide them, and a full condition report is always available. Age
                is a mark of authenticity, not something to apologise for.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-ink">
                From Scotland, ready for another story
              </h2>
              <p className="prose-warm mt-3">
                Scottish design, craft and provenance run through much of what we
                carry. We&rsquo;re proud of that, and we ship worldwide — a piece
                that started life in Scotland can just as easily begin its next
                chapter across the world.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container width="wide">
        <div className="flex flex-wrap gap-3 py-16">
          <Button href="/shop">Shop the collection</Button>
          <Button href="/sell" variant="secondary">
            Have something worth regenerating?
          </Button>
        </div>
      </Container>
    </>
  );
}
