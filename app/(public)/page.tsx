import Link from "next/link";
import { getPublicProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await getPublicProducts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <section className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-balance mb-3">
          Genuine finds from Scottish house clearances
        </h1>
        <p className="text-[var(--muted)] max-w-prose">
          Every piece here was recovered, checked and priced by hand — never
          mass-produced, never generic. Reserve what catches your eye and
          we&rsquo;ll arrange collection or delivery.
        </p>
      </section>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          <p className="font-medium text-[var(--ink)] mb-1">
            Nothing listed yet
          </p>
          <p className="text-sm">
            Once the database is connected and the first items are approved
            in the admin app, they&rsquo;ll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/product/${product.slug}`}
              className="group rounded-lg border border-[var(--line)] overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="aspect-square bg-[var(--line)]/40" />
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-1">
                  {product.category_name ?? "Uncategorised"}
                </p>
                <h2 className="font-medium mb-1">{product.meta_title}</h2>
                <p className="text-sm">
                  {product.status === "sold"
                    ? "Sold"
                    : product.asking_price
                    ? `£${product.asking_price.toFixed(2)}`
                    : "Price on request"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
