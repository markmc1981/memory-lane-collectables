import Link from "next/link";
import { Container } from "@/components/ui/container";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/" },
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
    <footer className="mt-24 border-t border-line bg-surface">
      <Container width="wide">
        <div className="grid grid-cols-2 gap-8 py-14 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-lg text-ink">Memory Lane Collectables</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Interesting vintage and collectable pieces, rediscovered through
              house clearances across Scotland.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.title}>
              <p className="overline mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-line-soft py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <span>
            &copy; {new Date().getFullYear()} Memory Lane Collectables. A Ceemac
            Removals &amp; Clearances business.
          </span>
          <span>Sourced and sold in Scotland.</span>
        </div>
      </Container>
    </footer>
  );
}
