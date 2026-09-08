import Link from "next/link";
import { Container } from "@/components/ui/container";

const primaryNav = [
  { label: "New Arrivals", href: "/" },
  { label: "Furniture", href: "/category/vintage-furniture" },
  { label: "Collectables", href: "/category/collectables" },
  { label: "Ceramics & Glass", href: "/category/ceramics-glass" },
  { label: "Art & Prints", href: "/category/art-prints" },
  { label: "Clearance Finds", href: "/category/clearance-finds" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-sm">
      <Container width="wide">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="shrink-0 leading-none">
            <span className="block font-display text-lg tracking-tight text-ink">
              Memory Lane
            </span>
            <span className="overline block leading-none">Collectables</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/sell"
              className="hidden text-ink-soft transition-colors hover:text-ink sm:block"
            >
              Sell to Us
            </Link>
            <Link
              href="/about"
              className="text-ink-soft transition-colors hover:text-ink"
            >
              About
            </Link>
          </div>
        </div>

        {/* Mobile category row — the desktop nav is hidden below lg */}
        <nav className="-mx-5 flex gap-5 overflow-x-auto px-5 pb-3 lg:hidden">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
