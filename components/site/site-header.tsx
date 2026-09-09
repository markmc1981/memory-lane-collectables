import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { HeaderSearch } from "./header-search";

function Search() {
  return (
    <Suspense fallback={<div className="h-9" />}>
      <HeaderSearch />
    </Suspense>
  );
}

const primaryNav = [
  { label: "Shop All", href: "/shop" },
  { label: "Furniture", href: "/category/vintage-furniture" },
  { label: "Collectables", href: "/category/collectables" },
  { label: "Ceramics & Glass", href: "/category/ceramics-glass" },
  { label: "Art & Prints", href: "/category/art-prints" },
  { label: "Clearance Finds", href: "/category/clearance-finds" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
      <Container width="wide">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href="/" className="shrink-0 leading-none">
            <span className="block font-display text-lg tracking-tight text-ink">
              Memory Lane
            </span>
            <span className="overline block leading-none">Collectables</span>
          </Link>

          <div className="hidden max-w-sm flex-1 lg:block">
            <Search />
          </div>

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

        <nav className="-mx-5 flex items-center gap-6 overflow-x-auto px-5 pb-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pb-3 lg:hidden">
          <Search />
        </div>
      </Container>
    </header>
  );
}
