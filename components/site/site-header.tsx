import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "./logo";
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
    <header className="sticky top-0 z-40 bg-ink text-paper ink-texture">
      <div className="container-wide">
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link href="/" aria-label="Memory Lane Collectables — home">
            <Logo tone="dark" />
          </Link>

          <div className="hidden max-w-sm flex-1 lg:block">
            <Search />
          </div>

          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/sell"
              className="hidden text-ink-muted transition-colors hover:text-paper sm:block"
            >
              Sell to Us
            </Link>
            <Link
              href="/about"
              className="text-ink-muted transition-colors hover:text-paper"
            >
              About
            </Link>
          </nav>
        </div>

        <nav className="-mx-1 flex items-center gap-6 overflow-x-auto px-1 pb-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm text-ink-muted transition-colors hover:text-paper"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pb-3 lg:hidden">
          <Search />
        </div>
      </div>
    </header>
  );
}
