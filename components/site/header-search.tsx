"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(
          q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop"
        );
      }}
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search vintage sideboard, 1960s watch, blue vase…"
        aria-label="Search the shop"
        className="h-9 w-full rounded-full border border-ink-line bg-ink-soft px-4 text-sm text-paper placeholder:text-ink-muted outline-none focus:border-accent"
      />
    </form>
  );
}
