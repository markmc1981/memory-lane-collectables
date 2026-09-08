# Memory Lane Collectables

A public ecommerce storefront **and** a private, mobile-first AI-assisted
resale operating system for **Ceemac Removals & Clearances** — one Next.js
app, one Supabase database, two clearly separated areas: the public site
(`/`, `/category/*`, `/product/*`, …) and the staff operations app
(`/admin/*`).

### Read these first

| Doc | What it covers |
|---|---|
| [`MEMORYLANE_MASTER_PLAN.md`](./MEMORYLANE_MASTER_PLAN.md) | System architecture, data model, AI & media pipeline, sales-channel strategy, phased roadmap, open decisions. |
| [`MEMORYLANE_PROGRESS.md`](./MEMORYLANE_PROGRESS.md) | Living status — what's done, what's next, blockers, credentials needed. **Start here when picking the project up.** |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Visual language, tokens, component rules. |

The fuller background (`master-requirements.md`, `database-schema.md`,
`decision-log.md`, `cluzy-analysis.md`) lives in Mark's "C-MAC SALES" Claude
Project.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · React 19 ·
Tailwind CSS v4 · Supabase (Postgres + Auth + Storage, via `@supabase/ssr`) ·
Vercel (target). AI behind a provider abstraction, Claude first. The
public/private boundary is enforced by Postgres Row Level Security — the
public site only ever reads the `public_products` view.

## First-time setup

1. **Supabase project** — already created (`plqnalygjwxcxqtepyrl`, eu-west-1).
   Migration `supabase/migrations/0001_init.sql` has been run: 12 tables +
   the `public_products` view + RLS on everything.
2. **Staff logins** — Mark's exists (`ceemacremovals@gmail.com`). To add
   another: Supabase → Authentication → Users → add the user, then in the
   SQL editor:
   ```sql
   insert into staff (id, name, role)
   values ('<the user id from the Authentication tab>', 'Stephen', 'admin');
   ```
   No `staff` row → no `/admin` access. That's the gate.
3. **Env** — `cp .env.example .env.local` and fill in at least
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase → Settings → API Keys → the publishable key). Every other key in
   `.env.example` is documented but optional until its phase.
4. **Run it**:
   ```bash
   npm install
   npm run dev
   ```
   `http://localhost:3000` — storefront. `/admin/login` — staff app.
5. **Deploy** — import the repo to Vercel, set the same env vars, point
   `memorylanecollectables.co.uk` at it.

## Project layout

```
app/(public)/        storefront — home, categories, product, about, sell, …
app/admin/           operations app (auth-gated by proxy.ts + a staff row)
components/ui/        shared design-system primitives
components/site/      storefront chrome (header, footer, page header)
lib/supabase/         server / browser / proxy clients
lib/ui/               non-visual helpers (clsx, formatters)
lib/data/             the only public read path (getPublicProducts)
supabase/migrations/  the schema, in order — source of truth for the DB
```

## Current state (2026-09-08)

Phase 1 foundations done; Phase 1.5 (design system) in place for review.
Storefront pages are built with the new design system but there's no product
data yet, and the operations app beyond auth + job/stock lists is still to
come. See `MEMORYLANE_PROGRESS.md` for the exact next task.
