import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Memory Lane Collectables
          </Link>
          <nav className="flex gap-6 text-sm text-[var(--muted)]">
            <Link href="/">Browse</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--line)] mt-16">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-[var(--muted)] flex justify-between">
          <span>&copy; {new Date().getFullYear()} Memory Lane Collectables</span>
          <span>Sourced from house clearances across Scotland</span>
        </div>
      </footer>
    </div>
  );
}
