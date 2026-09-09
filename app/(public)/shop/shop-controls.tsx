"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function ShopControls({
  categories,
}: {
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const activeCat = params.get("category") ?? "";

  return (
    <div className="space-y-6 text-sm">
      <div>
        <p className="overline mb-2">Category</p>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => set("category", null)}
              className={
                activeCat === "" ? "text-ink" : "text-ink-soft hover:text-ink"
              }
            >
              Everything
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                onClick={() => set("category", c.slug)}
                className={
                  activeCat === c.slug
                    ? "text-ink"
                    : "text-ink-soft hover:text-ink"
                }
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="overline mb-2">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={params.get("min") ?? ""}
            onBlur={(e) => set("min", e.target.value || null)}
            className="h-9 w-full rounded border border-line bg-surface px-2 outline-none focus:border-ink"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={params.get("max") ?? ""}
            onBlur={(e) => set("max", e.target.value || null)}
            className="h-9 w-full rounded border border-line bg-surface px-2 outline-none focus:border-ink"
          />
        </div>
      </div>

      <div>
        <p className="overline mb-2">Sort</p>
        <select
          value={params.get("sort") ?? "newest"}
          onChange={(e) => set("sort", e.target.value)}
          className="h-9 w-full rounded border border-line bg-surface px-2 outline-none focus:border-ink"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
