import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/components/ui/product-card";
import { getPublicProducts } from "@/lib/data/products";

const collections = [
  { label: "The Scottish Collection", href: "/collections/scottish" },
  { label: "Mid-Century Finds", href: "/collections/mid-century" },
  { label: "One of a Kind", href: "/collections/one-of-a-kind" },
  { label: "Under £100", href: "/collections/under-100" },
];

const journal = [
  {
    kicker: "Guide",
    title: "How to read the marks on a piece of studio pottery",
    href: "/stories/reading-pottery-marks",
  },
  {
    kicker: "Design",
    title: "Why mid-century teak still holds its value",
    href: "/stories/mid-century-teak",
  },
  {
    kicker: "Scotland",
    title: "The Glasgow School and the objects it left behind",
    href: "/stories/glasgow-school",
  },
];

export default async function HomePage() {
  const products = await getPublicProducts();
  const newArrivals = products.slice(0, 8);

  return (
    <>
      {/* ---------- Hero — dark band ---------- */}
      <section className="bg-ink text-paper ink-texture">
        <div className="container-wide">
          <div className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-accent">
                Vintage · Antique · Collectable
              </p>
              <h1 className="mt-5 font-display text-4xl leading-[1.03] sm:text-5xl">
                Objects with a past,
                <br />
                ready for their next chapter.
              </h1>
              <p className="mt-5 max-w-prose text-lg text-paper/80">
                A curated circular-commerce brand from Scotland. Every piece is
                identified, researched and regenerated — then passed on to
                someone who will love it again.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/shop" size="lg">
                  Shop everything
                </Button>
                <Button href="#new-arrivals" variant="on-dark" size="lg">
                  See new arrivals
                </Button>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-ink-line bg-ink-soft lg:aspect-square">
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span className="font-display text-xl text-ink-muted">
                  Hero photograph
                </span>
                <span className="max-w-[16rem] text-xs text-ink-muted">
                  One strong, editorial image of a single piece — 1stDibs style.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- New arrivals ---------- */}
      <section id="new-arrivals" className="scroll-mt-24 py-16 sm:py-20">
        <div className="container-wide">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="overline mb-2">Just listed</p>
              <h2 className="font-display text-3xl text-ink">New Arrivals</h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm text-accent-dark underline underline-offset-4 sm:block"
            >
              View everything
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <EmptyState
              title="The first pieces are on their way"
              action={
                <Button href="/regenerated" variant="secondary" size="sm">
                  How regeneration works
                </Button>
              }
            >
              We&rsquo;re cataloguing the next set of finds now. Check back
              shortly, or follow along on the journal.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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
        </div>
      </section>

      {/* ---------- The Memory Lane difference — dim band ---------- */}
      <section className="border-y border-paper-line bg-paper-dim py-16 sm:py-20">
        <div className="container-wide">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
            <div className="aspect-[4/3] rounded-[var(--radius-card)] bg-surface" />
            <div className="flex flex-col justify-center">
              <p className="overline mb-3">Regenerated by Memory Lane</p>
              <h2 className="font-display text-3xl text-ink">
                Discover · Identify · Regenerate · Recirculate
              </h2>
              <p className="prose-warm mt-4">
                We find remarkable pieces before they leave circulation, then use
                technology, research and a careful eye to identify each one,
                value it against real sold prices, and present it properly. Every
                piece carries an honest account of its condition.
              </p>
              <div className="mt-6">
                <Button href="/regenerated" variant="link">
                  How regeneration works &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Collections ---------- */}
      <section className="py-16 sm:py-20">
        <div className="container-wide">
          <p className="overline mb-2">Curated</p>
          <h2 className="font-display text-3xl text-ink">Collections</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group relative flex aspect-[5/4] items-end overflow-hidden rounded-[var(--radius-card)] border border-paper-line bg-paper-dim p-4 transition-shadow hover:shadow-lg"
              >
                <span className="font-display text-lg text-ink transition-transform duration-300 ease-[--ease] group-hover:translate-x-1">
                  {c.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Journal — dim band ---------- */}
      <section className="border-y border-paper-line bg-paper-dim py-16 sm:py-20">
        <div className="container-wide">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="overline mb-2">The journal</p>
              <h2 className="font-display text-3xl text-ink">
                Notes on what we find
              </h2>
            </div>
            <Link
              href="/stories"
              className="hidden text-sm text-accent-dark underline underline-offset-4 sm:block"
            >
              All articles
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {journal.map((post) => (
              <Link key={post.href} href={post.href} className="group block">
                <div className="mb-3 aspect-[3/2] rounded-[var(--radius-card)] bg-surface" />
                <p className="overline mb-1">{post.kicker}</p>
                <h3 className="font-display text-lg leading-snug text-ink transition-colors group-hover:text-accent-dark">
                  {post.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Newsletter — dark band ---------- */}
      <section className="bg-ink text-paper ink-texture py-16">
        <div className="container-wide">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="font-display text-2xl">First look at new finds</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-paper/75">
              An occasional email when something unusual comes in. No more than
              that.
            </p>
            <form className="mx-auto mt-6 flex max-w-sm gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                aria-label="Email address"
                className="h-11 flex-1 rounded-full border border-ink-line bg-ink-soft px-4 text-sm text-paper placeholder:text-ink-muted outline-none focus:border-accent"
              />
              <Button type="submit">Sign up</Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
