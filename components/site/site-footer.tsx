import Link from "next/link";
import { Logo } from "./logo";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "Shop All", href: "/shop" },
      { label: "Vintage Furniture", href: "/category/vintage-furniture" },
      { label: "Collectables", href: "/category/collectables" },
      { label: "Clearance Finds", href: "/category/clearance-finds" },
    ],
  },
  {
    title: "Memory Lane",
    links: [
      { label: "About us", href: "/about" },
      { label: "Sell to Memory Lane", href: "/sell" },
      { label: "Delivery & collection", href: "/delivery" },
      { label: "The journal", href: "/stories" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper ink-texture">
      <div className="container-wide">
        <div className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo tone="dark" />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              Interesting vintage and collectable pieces, rediscovered through
              house clearances across Scotland.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title}>
              <p className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-paper/85 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-ink-line py-6 text-xs text-ink-muted sm:flex-row sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Memory Lane Collectables. A Ceemac
            Removals &amp; Clearances business.
          </span>
          <span>Sourced and sold in Scotland.</span>
        </div>
      </div>
    </footer>
  );
}
