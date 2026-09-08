import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

const nav = [
  { label: "Dashboard", href: "/admin" },
  { label: "Clearances", href: "/admin/clearances" },
  { label: "Needs review", href: "/admin/review" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Reservations", href: "/admin/reservations" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // The login page renders its own full-screen layout.
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Sidebar on desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface p-5 lg:flex">
        <Link href="/admin" className="mb-6 block leading-tight">
          <span className="block font-display text-base text-ink">
            Memory Lane
          </span>
          <span className="overline">Operations</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 truncate text-xs text-muted">{user.email}</p>
        <SignOutButton />
      </aside>

      {/* Top bar on mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Link href="/admin" className="font-display text-sm text-ink">
          Memory Lane · Ops
        </Link>
        <SignOutButton />
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
          {children}
        </div>

        {/* Bottom nav on mobile — one-handed reach */}
        <nav className="sticky bottom-0 z-30 flex items-stretch justify-around border-t border-line bg-surface/95 backdrop-blur-sm lg:hidden">
          {nav.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 px-1 py-3 text-center text-2xs font-medium text-ink-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
