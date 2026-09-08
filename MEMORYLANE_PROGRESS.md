# Memory Lane Collectables — Progress

> Living status doc. Read this first when picking the project up. Update it as
> work lands. Architecture lives in `MEMORYLANE_MASTER_PLAN.md`.
>
> Last updated: 2026-09-08 (session: master-brief audit + design system;
> storefront now live on the real domain).

---

## Where the project is right now

**Phases 1, 1.5, 2 done. Phase 3 built, needs an Anthropic API key to
activate real AI (mock works meanwhile).** Storefront live on the real
domain; the full clearance → detect → identify → review → approve → live
product workflow is built and testable in `/admin`. Migrations 0001 + 0002
applied. No real product data yet.

---

## ✅ Done

- **Repo on GitHub** — `github.com/markmc1981/memory-lane-collectables`
  (private). Pushed 2026-09-07 from Mark's PC (the sandbox can't push;
  Claude Code's classifier blocks `git push` — Mark runs it manually).
- **Next.js 16 scaffold** — App Router, TS strict, Tailwind v4, `@supabase/ssr`.
- **Database** — `supabase/migrations/0001_init.sql` run against project
  `plqnalygjwxcxqtepyrl` (eu-west-1, Free tier). 12 tables + `public_products`
  view, RLS on every table, `is_active_staff()` + `set_updated_at()`.
  Verified as `anon`: staff / jobs / stock / reservations all return 0 rows.
- **Admin auth** — email/password (Supabase Auth), `/admin` gated by `proxy.ts`
  + a `staff` row. Mark's login works (`ceemacremovals@gmail.com`).
- **Storefront shell** — home / category / product pages read `public_products`
  only; `Product` JSON-LD; `sitemap.xml` + `robots.txt` live.
- **Admin shell** — jobs list + new-job form, per-job item creation with
  sequential stock numbers, reservations list (read-only).
- **`.env.example`** — was gitignored (never committed); fixed with a
  `!.env.example` rule and expanded into a full documented template
  (`MEMORYLANE_MASTER_PLAN.md` §env). ⚠️ commit not yet pushed.
- **`MEMORYLANE_MASTER_PLAN.md`** — written this session.

---

## ⏳ In progress (this session)

- **Design system (Phase 1.5).** `DESIGN_SYSTEM.md` + design tokens in
  `app/globals.css` + `next/font` + core primitives (`Button`, `Badge`,
  `Card`, `Container`, `Price`, `Field`, `EmptyState`) + refreshed public
  header/footer + homepage hero and sections. Goal: something Mark reviews
  and signs off before feature building resumes.

---

## ▶️ Next recommended tasks

1. **Add `ANTHROPIC_API_KEY`** (Mark, when ready) → real detection + identify.
   Then test on a real clearance; tune the prompts in `lib/ai/providers/claude.ts`.
2. **Phase 3 remainder:** photograph hallmarks/labels as separate "mark"
   photos on a candidate and feed them to `identifyItem` (the provider
   method already accepts `markPhotos`); a per-product identify/edit screen
   in `/admin/inventory/[id]`.
3. **Phase 4 (inventory ops):** storage locations + QR, bulk status changes,
   the Listed/Sold pipeline.
4. Storefront: real product gallery (multiple photos), search/filter UI.

## What's built in the workflow (Phase 2 + 3)

- `lib/ai/`: `VisionProvider` abstraction, `types.ts` (confidence labels,
  risk flags, `DetectedObject`, `Identification`), `mock.ts` (zero-key
  fixtures), `providers/claude.ts` (real, structured output, adaptive
  thinking, cost tracking), `index.ts` resolver (server-only).
- `/admin` rebranded "Memory Lane — Operations": dashboard tiles, sidebar +
  mobile bottom nav.
- `/admin/clearances`: list, new (mints `CLR-YYYY-####`), `[id]` (photo
  upload straight to Storage + "Analyse photos"), `[id]/review` (bulk
  select/ignore, per-candidate Identify + IdentificationPanel, inline
  Approve & list → mints `ML-YYYY-####`, creates product_page, copies photo
  to public bucket, item goes live).
- `/admin/review` global queue, `/admin/inventory` stock table.
- Storefront renders real product photos (home / category / product).
- Legacy `/admin/jobs` flow removed.

---

## Live URLs

- **Storefront:** https://www.memorylanecollectables.co.uk (Vercel, auto-deploys
  from `main`). Currently the new design + empty product states.
- **Staff app:** https://www.memorylanecollectables.co.uk/admin/login
  (Mark: `ceemacremovals@gmail.com` + the password set in Supabase Auth).
- **Local:** `npm run dev` → http://localhost:3000.
- Vercel project: `markmc1981s-projects/memory-lane-collectables`.

## ⚠️ Blockers / actions needed from Mark

| # | What | Status |
|---|---|---|
| B1 | Supabase publishable key in `.env.local` | ✅ done 2026-09-08 (`sb_publishable_fN7oo…`). |
| B2 | Push commits | ✅ done — pushes work without `--force`. Through `69db6b9`. |
| B3 | **Stephen's login** — Supabase → Auth → Users → add him; then `insert into staff (id, name, role) values ('<his uid>', 'Stephen', 'admin');` | ⏳ deferred — do when he needs access. |
| B4 | Vercel deploy | ✅ already set up (2d ago) — env vars + `memorylanecollectables.co.uk` domain live. Auto-deploys on push. NB: verify the Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches the current key before adding real products. |
| B5 | **Decide D1–D5** in `MEMORYLANE_MASTER_PLAN.md` §10 (SKU naming, ownership model, reservation contact, photo storage, "found in <town>") | ⏳ D1 (`CMS-`→`ML-` prefix) is cheapest now, before any stock exists. |

## 🔑 Credentials / accounts still to obtain (not blocking Phase 2)

- Anthropic API key (real AI identification — Phase 2 runs on `mock` without it)
- eBay developer account (Browse API for active comparables — Phase 3/5)
- Etsy app keys (Phase 5, if selling there)
- Email provider (Resend/Postmark) — reservation confirmations (Phase 7)
- Stripe account — Phase 9 only, on Mark's explicit go

---

## 🐞 Known issues / cleanups

- No `public/` assets, no favicon, no `og:image`.
- `sitemap.ts` / `robots.ts` hard-code `https://memorylanecollectables.co.uk`
  — move to `NEXT_PUBLIC_SITE_URL`.
- Naming split: "C Mac Sales" + `CMS-` in code vs "Memory Lane Collectables" +
  `ML-` in the brand/brief (Decision D1).
- `createJob` server action does no validation and surfaces errors only to
  server logs (needs Zod + a visible form error — fold into Phase 1.5/2).
- No tests, no CI.
- Product page "Reserve this item" button has no form yet (Phase 7 / 1f).

---

## Session log

| Date | Session | Outcome |
|---|---|---|
| 2026-09-06 | Phase 1a build | Scaffold, schema, admin auth, storefront shell. |
| 2026-09-07 | GitHub push | Repo finally pushed from Mark's PC after sandbox/token blockers. |
| 2026-09-07 | Supabase check | DB verified fully migrated + RLS working; Mark's staff login confirmed. |
| 2026-09-08 | Master brief | Full audit; `MEMORYLANE_MASTER_PLAN.md` + this doc written; `.env.example` fixed & expanded; design system started. |
