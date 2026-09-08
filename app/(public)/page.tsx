import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/ui/product-card";
import { getPublicProducts } from "@/lib/data/products";

const collections = [
  { label: "Mid-Century Finds", href: "/collections/mid-century" },
  { label: "Scottish Collectables", href: "/collections/scottish" },
  { label: "Under £50", href: "/collections/under-50" },
  { label: "Unusual Finds", href: "/collections/unusual" },
];

const journal = [
  {
    kicker: "Guide",
    title: "How to spot vintage teak furniture worth keeping",
    href: "/stories/spotting-vintage-teak",
  },
  {
    kicker: "Scotland",
    title: "A short guide to Scottish studio pottery marks",
    href: "/stories/scottish-pottery-marks",
  },
  {
    kicker: "From the van",
    title: "Five things nearly thrown out this month",
    href: "/stories/nearly-thrown-out",
  },
];

export default async function HomePage() {
  const products = await getPublicProducts();
  const newArrivals = products.slice(0, 8);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-line">
        <Container width="wide">
          <div className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <p className="overline mb-5">Vintage · Antique · Collectable</p>
              <h1 className="font-display text-4xl leading-[1.05] text-ink sm:text-5xl">
                Objects with a story.
              </h1>
              <p className="prose-warm mt-5 text-lg">
                Unusual vintage, collectable and one-off pieces, rediscovered
                through house clearances across Scotland — each one recovered,
                checked and priced by hand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="#new-arrivals" size="lg">
                  Shop New Arrivals
                </Button>
                <Button href="/collections/mid-century" variant="secondary" size="lg">
                  Explore Collections
                </Button>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunk lg:aspect-square">
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span className="font-display text-xl text-muted">
                  Hero photograph
                </span>
                <span className="max-w-[16rem] text-xs text-muted">
                  A single strong image of a recovered piece goes here — see
                  DESIGN_SYSTEM.md.
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- New arrivals ---------- */}
      <section id="new-arrivals" className="scroll-mt-24 py-16 sm:py-20">
        <Container width="wide">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="overline mb-2">Just listed</p>
              <h2 className="font-display text-3xl text-ink">New Arrivals</h2>
            </div>
            <Link
              href="/category/new-arrivals"
              className="hidden text-sm text-accent underline underline-offset-4 sm:block"
            >
              View everything
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <EmptyState
              title="The first pieces are on their way"
              action={
                <Button href="/about" variant="secondary" size="sm">
                  Read our story
                </Button>
              }
            >
              We&rsquo;re cataloguing a fresh clearance now. Check back shortly,
              or follow along on the journal.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.slug}
                  product={{
                    slug: product.slug,
                    title: product.meta_title,
                    categoryName: product.category_name,
                    askingPrice: product.asking_price,
                    currency: product.currency,
                    status: product.status,
                    photoUrl: product.photo_url,
                  }}
                />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ---------- The Memory Lane difference ---------- */}
      <section className="border-y border-line bg-surface py-16 sm:py-20">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div className="aspect-[4/3] rounded-lg bg-surface-sunk" />
            <div className="flex flex-col justify-center">
              <p className="overline mb-3">The Memory Lane difference</p>
              <h2 className="font-display text-3xl text-ink">
                Another life, rather than the skip
              </h2>
              <p className="prose-warm mt-4">
                Most of what we sell was found during a house clearance and set
                aside because it was interesting, well made, or simply worth a
                second look. We research each piece, note its condition
                honestly, and pass it on to someone who will use it.
              </p>
              <div className="mt-6">
                <Button href="/about" variant="link">
                  How Memory Lane works &rarr;
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------- Collections ---------- */}
      <section className="py-16 sm:py-20">
        <Container width="wide">
          <p className="overline mb-2">Curated</p>
          <h2 className="font-display text-3xl text-ink">Collections</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative flex aspect-[5/4] items-end overflow-hidden rounded-lg bg-surface-sunk p-4"
              >
                <span className="font-display text-lg text-ink transition-transform duration-300 ease-[--ease] group-hover:translate-x-1">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------- Journal ---------- */}
      <section className="border-t border-line py-16 sm:py-20">
        <Container width="wide">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="overline mb-2">The journal</p>
              <h2 className="font-display text-3xl text-ink">
                Notes on what we find
              </h2>
            </div>
            <Link
              href="/stories"
              className="hidden text-sm text-accent underline underline-offset-4 sm:block"
            >
              All articles
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {journal.map((post) => (
              <Link key={post.href} href={post.href} className="group block">
                <div className="mb-3 aspect-[3/2] rounded bg-surface-sunk" />
                <p className="overline mb-1">{post.kicker}</p>
                <h3 className="font-display text-lg leading-snug text-ink group-hover:underline group-hover:decoration-line group-hover:underline-offset-4">
                  {post.title}
                </h3>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------- Newsletter ---------- */}
      <section className="border-t border-line bg-accent-tint py-16">
        <Container width="default">
          <div className="text-center">
            <h2 className="font-display text-2xl text-ink">
              First look at new finds
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              An occasional email when something unusual comes in. No more than
              that.
            </p>
            <form className="mx-auto mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                className="h-10 flex-1 rounded border border-line bg-surface px-3 text-sm outline-none focus:border-ink"
              />
              <Button type="submit">Sign up</Button>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}
