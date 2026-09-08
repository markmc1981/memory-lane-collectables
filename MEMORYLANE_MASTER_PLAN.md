# Memory Lane Collectables — Master Plan

> System architecture, data model, and phased roadmap for the Memory Lane
> Collectables platform: a public ecommerce storefront **and** a private,
> mobile-first AI-assisted resale operating system, sharing one database.
>
> This is the standing architecture document. `MEMORYLANE_PROGRESS.md` tracks
> what is built and what to do next. When a decision here changes, change it
> here — don't let the two documents drift.
>
> Last reviewed: 2026-09-08

---

## 1. What we are building

Memory Lane Collectables resells furniture, antiques, collectables and
household goods recovered during house clearances by **Ceemac Removals and
Clearances** (Mark & Stephen, Scotland).

The competitive advantage is not "a shop that sells collectables". It is the
pipeline that turns a house full of unknown objects into sale-ready,
correctly-valued, multichannel stock:

```
HOUSE CLEARANCE
  -> CAPTURE (photos / video walkthrough)
  -> AI IDENTIFICATION (what is it? maker, era, materials, marks)
  -> VALUATION (comparable sales -> quick / expected / optimistic)
  -> REVIEW (a human approves — AI never auto-publishes)
  -> INVENTORY (SKU, location, status)
  -> LISTING (Memory Lane site + marketplaces where permitted)
  -> SALE
  -> CROSS-CHANNEL DEACTIVATION (sold here => removed everywhere)
  -> PROFIT RECORDED
```

Two surfaces, one Supabase database:

| Surface | Who | Feel |
|---|---|---|
| **Public storefront** (`/`, `/browse`, `/product/*`, …) | Customers | Calm, premium, editorial. Like a modern antiques gallery. Never looks like a dashboard. |
| **Operations app** (`/admin/*`) | Mark & Stephen, on a phone, standing in a property | Fast, one-handed, big tap targets, camera-first. Powerful but never complicated. |

The public/private boundary is enforced **in the database** (Row Level
Security), not just hidden in the UI. Customer addresses, acquisition costs,
margins, storage locations and staff details are never exposed to the public
role.

### The guiding principle

> **Photograph it. Identify it. Value it. Approve it. Sell it.**
> The technology can be sophisticated. The experience must be simple.

---

## 2. Tech stack (decided — do not change without asking Mark)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Already scaffolded. `proxy.ts` is the Next 16 middleware file. |
| Language | **TypeScript**, `strict: true` | |
| UI | **React 19**, **Tailwind CSS v4** | Tailwind v4 = CSS-first config in `app/globals.css`. |
| Database / Auth / Storage | **Supabase** (Postgres + Auth + Storage) | One project: `plqnalygjwxcxqtepyrl`, AWS `eu-west-1`, Free tier. |
| DB access | `@supabase/ssr` | Server client (cookies), browser client, proxy session refresh. |
| Security boundary | **Postgres RLS** + `is_active_staff()` | Public site reads the `public_products` view only. |
| Hosting | **Vercel** | Not yet connected. |
| AI | **Claude first**, behind a provider abstraction | OpenAI / Gemini / OCR added later via config. |
| Background jobs | Postgres-backed queue to start; Redis-swappable | Video processing + bulk AI can't run in a request. |
| Payments | **Reserve / Enquire in Phase 1.** Stripe adapter later. | DB already shaped so Stripe bolts on without restructuring. |

**Ignore** the older `ecommerce-website-build-design.md` template (Cloudflare
Pages/D1 + Stripe Checkout, from the unrelated "Whats Oan" project). Mark
confirmed on 2026-09-07: keep this Supabase / Reserve-Enquire build.

### Deliberate non-goals for now

- No full multi-tenancy (but see §11 — don't foreclose it).
- No web scraping or browser automation, ever, for price research — only
  official APIs or manually-entered, source-attributed comparables.
- No faked marketplace integrations — see §8.

---

## 3. Repository state (audit, 2026-09-08)

Built and working (commit `2960d7f`, "Phase 1a foundations"):

```
app/
  layout.tsx                     root metadata
  globals.css                    5 design tokens, ~10 lines (placeholder)
  (public)/
    layout.tsx                   header + footer shell
    page.tsx                     storefront grid, empty-state, reads public_products
    category/[slug]/page.tsx     category grid
    product/[slug]/page.tsx      product page + Product JSON-LD + Reserve button (no form)
  admin/
    layout.tsx                   sidebar, auth-aware
    login/page.tsx               email/password (Supabase Auth)
    page.tsx                     jobs list + "new job" form + status-count chips
    jobs/[jobId]/page.tsx        per-job item list + "add item"
    jobs/[jobId]/items/[itemId]/page.tsx   placeholder for capture/AI
    reservations/page.tsx        reservations list (read-only)
    actions.ts                   createJob, getNextStockNumber, createStockItem
    sign-out-button.tsx
  robots.ts, sitemap.ts          both live, point at memorylanecollectables.co.uk
lib/
  supabase/{server,client,middleware}.ts
  data/products.ts               getPublicProducts() — the only public read path
proxy.ts                         session refresh + /admin gate (matcher = all routes)
supabase/migrations/0001_init.sql   12 tables + enums + RLS + public_products view
```

Supabase project state (verified in dashboard):

- Migration `0001_init.sql` **has been run** — all 12 tables + `public_products`
  view exist, RLS enabled on all 12, policies correct.
- `is_active_staff()` (security definer) and `set_updated_at()` exist.
- **1 staff user**: `ceemacremovals@gmail.com` -> `staff` row (Mark, owner,
  active). **Stephen not set up yet.**
- Data API enabled. Database otherwise empty (no categories/jobs/stock).

Known gaps / cleanups (tracked in `MEMORYLANE_PROGRESS.md`):

1. `.env.example` was gitignored and never committed — fixed 2026-09-08
   (`!.env.example` exception added), and expanded to a full template.
2. Local `.env.local` needs the real Supabase publishable key pasted in
   (placeholder committed locally, gitignored).
3. Naming: code says **"C Mac Sales"** and `CMS-` stock numbers; the brand /
   domain / master brief say **Memory Lane Collectables** and want `ML-` SKUs.
   See §10 Open Decision D1.
4. No `public/` assets, no favicon, no fonts loaded.
5. No tests, no CI.

Nothing above is wrong enough to rebuild. The data flow and the security
boundary are sound. We extend it.

---

## 4. Domain model

The existing 12 tables are Phase-1-correct but narrower than the full vision.
The plan is **additive migrations**, never a rebuild. Target entity set,
grouped by area (│ = exists today, ✎ = extend, + = new):

### Clearances & capture
- │ `clearance_jobs` — ✎ rename concept to "clearance", add `reference`
  (`CLR-2026-0042`), `status`, optional cost fields kept **nullable and
  private** (customer clearance fee, disposal cost, labour — for §12
  profitability, never public).
- + `clearance_media` — a raw upload attached to a clearance: photo or video,
  `storage_path`, `kind`, `duration`, `processing_status`.
- + `media_frames` — frames extracted from a video: `clearance_media_id`,
  `storage_path`, `timestamp_ms`, `sharpness_score`, `is_selected`.

### Detection & candidates
- + `candidate_items` — a *possible* saleable object detected by AI. **Not a
  product.** `clearance_id`, source media/frame refs, `bounding_box` jsonb,
  `label`, `confidence`, `status` (`detected` / `merged` / `promoted` /
  `ignored` / `needs_better_photo`), `merged_into_id` (self-ref for dedupe &
  "set of 6 chairs" grouping).
- + `ai_jobs` — one async AI unit of work: `type` (`detect` / `identify` /
  `research` / `write_listing` / `enhance_image`), `subject_type`,
  `subject_id`, `provider`, `model`, `status`, `cost`, `error`, timestamps.
- + `ai_results` — output of an `ai_job`: `raw` jsonb, `prompt_version`,
  `confidence`, `evidence` (which photos/marks fed it). Immutable audit trail —
  we must always be able to say *which AI decision produced this value*.

### Inventory
- │ `stock_items` — ✎ this is the "product". Add: `title`, `subtitle`,
  `brand_id`, `maker`, `model`, `era`, `material`, `colour`, `style`,
  `dimensions` jsonb, `condition_grade`, `condition_notes`, `risk_flags`
  jsonb (§9), `days_listed` (computed), `promoted_from_candidate_id`.
- + `brands` — `name`, `slug`, notes. Light table; helps search + reporting.
- │ `categories` — keep. Seed the real taxonomy (§5).
- + `product_attributes` — flexible EAV-ish `(stock_item_id, key, value,
  source)` for AI-suggested attributes we don't want as columns.
- │ `item_photos` — ✎ add `role` (`original` / `listing` / `mark` / `detail`),
  `is_ai_enhanced` bool, `original_photo_id` (enhanced -> original link).
  **An unedited original is always retained.**
- + `item_marks` — a photographed hallmark / signature / label / stamp /
  serial, linked to its item, re-analysable (§ "markings" in brief).

### Locations
- + `inventory_locations` — `code` (`UNIT-A/SHELF-01`, `MARKS-HOUSE`, …),
  `kind`, `qr_token`.
- + `inventory_movements` — append-only: item X moved to location Y by staff Z
  at time T. History, not just current state.
- │ `stock_items.storage_location` (text today) -> FK to `inventory_locations`.

### Valuation
- │ `price_research` — ✎ keep; this is `valuation_comparables`. Add
  `similarity_score`, `sold_date`, keep `is_verified_sold` (sold data weighs
  far more than asking prices).
- │ `price_suggestions` — ✎ this is the `valuation`. Add `quick_sale_low/high`,
  `expected_low/high`, `optimistic`, `median`, `sample_size`,
  `confidence_label`.

### Listings & channels
- │ `listings` — ✎ one row per (item, channel). Add `channel_price`,
  `sync_status` (`pending` / `live` / `ended` / `action_required` /
  `error`), `last_synced_at`.
- + `sales_channels` — `key` (`memory_lane` / `ebay` / `facebook` / `vinted` /
  `etsy`), `integration_level` (`full_api` / `assisted` / `export`),
  `is_connected`, `config` jsonb. Drives the Integrations screen (§8).
- │ `product_pages` — keep as-is. Public record survives the item selling.

### Orders & customers (Phase 1 = reservations; Phase 2 = orders)
- │ `reservations` — keep. 48h expiry. Public can INSERT only.
- + `customers` — created from a reservation/enquiry. Email, name, phone,
  postcode. **No stored card data, ever.**
- + `orders`, `order_items`, `payments`, `shipments` — Phase 2. Shaped now in
  this doc so the reservation -> order upgrade doesn't churn the schema.
- + `sell_to_us_submissions` — public "Sell to Memory Lane" form: photos +
  description -> AI triage -> staff response (`interested` / `more_info` /
  `not_suitable` / `arrange_valuation`). **Never an automated binding offer.**

### People & audit
- │ `staff` — ✎ add richer `role` enum: `admin` / `manager` / `staff` /
  `photographer` (brief §39). Today it's `owner` / `staff`.
- │ `activity_log` — ✎ generalise `stock_item_id` to `(subject_type,
  subject_id)` so clearances, listings, orders log too. Audit important
  actions (approve, price change, publish, mark sold).

> **Rule:** no giant `product` JSON blob. Real columns for things we filter,
> sort or report on; `jsonb` only for genuinely open-ended AI attributes,
> bounding boxes, raw responses, fee breakdowns.

Every migration: sensible indexes (every FK, every `status`, `slug`,
`stock_number`/`reference`), `not null` + `check` constraints, `updated_at`
triggers, and RLS enabled **in the same migration that creates the table**
(Supabase advisor will flag any table that misses it).

---

## 5. Public storefront

### Routes
```
/                         home (hero, new arrivals, collections, editorial teaser)
/browse                   all items, full filter/search UI
/c/[category]             category (nested: /c/furniture/sideboards)
/collections/[slug]       curated set (Mid-Century Finds, Under £50, Scottish…)
/product/[slug]           product detail
/product/[slug]/reserve   reservation form (Phase 1f) — its own route, not a modal
/stories                  editorial index (SEO asset)
/stories/[slug]           article
/sell                     "Sell to Memory Lane" submission flow
/about  /delivery  /contact  /privacy  /terms
```

### Category taxonomy (seed)
New Arrivals · Vintage Furniture (Sideboards, Tables, Chairs, Storage,
Mid-Century) · Collectables · Watches & Jewellery · Ceramics & Glass ·
Art & Prints · Toys & Games · Books & Media · Lighting & Clocks ·
Clearance Finds. Plus curated **collections** that cut across categories.

### Homepage sections
1. **Hero** — one strong photograph, restrained type. Headline candidate
   *"Objects with a story."* Sub: discovering unusual vintage, collectable and
   one-off pieces rediscovered through house clearances across Scotland.
   CTAs: *Shop New Arrivals* / *Explore Collections*.
2. **New Arrivals** — 8–12 items, fast card grid.
3. **The Memory Lane difference** — 2–3 sentences, one image. No wall of text.
4. **Recently discovered** — items with a non-sensitive found-location
   ("Found in Airdrie"). **Never a former customer's address.**
5. **Collections** — 4–6 visual tiles.
6. **From the journal** — 3 editorial teasers.
7. **Newsletter** — one field, quiet.

### Product page
Gallery (multiple photos + optional video) · title · price · condition ·
dimensions · maker/brand · era · material · description · delivery &
collection · stock status · related items. Two optional blocks driven **only
by our records** (never invented): **"What we know about this piece"**
(researched facts) and **"The story"** (provenance sentence — only if we have
one). `Product` + `BreadcrumbList` JSON-LD.

### Search & filter
Natural queries ("vintage sideboard", "1960s watch", "blue glass vase").
Filters: category, era, maker/brand, material, condition, price, colour,
availability, newly-listed, sale. Postgres full-text to start (`tsvector` on
title + description + attributes); the query layer is abstracted so it can
move to a dedicated search service if volume demands. Autocomplete endpoint
from day one even if simple.

### SEO baseline (from day one)
Semantic HTML, clean URLs, canonical tags, `Product` / `BreadcrumbList` /
`Organization` JSON-LD, OpenGraph + Twitter cards, `sitemap.xml` (live),
`robots.txt` (live, `/admin` disallowed), descriptive `alt` text pipeline,
correct heading hierarchy, SSR, internal linking, the `/stories` content
architecture. No keyword stuffing. Targets to grow into: *vintage furniture
Scotland/Glasgow*, *mid century furniture Glasgow*, *collectables Scotland*,
*house clearance finds*.

---

## 6. Operations app (`/admin`)

### Navigation
Dashboard · New Clearance · Scan · Inventory · Needs Review · Ready to List ·
Listed · Sold · Reservations (→ Orders) · Clearances · Sales Channels ·
Reports · Settings.

### The one workflow everything serves
```
New Clearance
  -> Capture: photos and/or a video walkthrough
  -> AI detects multiple objects  -> candidate_items (NOT products)
  -> Review queue: approve / edit / merge / ignore / needs-better-photo
  -> AI identification (+ re-run with mark photos)
  -> Comparable sales research -> valuation (quick / expected / optimistic)
  -> AI title + description (per channel)
  -> Set asking price -> Approve & Create Product (SKU minted here)
  -> Publish to Memory Lane store
  -> Prepare / publish marketplace listings (per channel capability)
  -> Track sale -> deactivate other channels -> record profit
```

### Mobile-first, specifically
- Primary actions reachable one-handed (bottom of viewport on mobile).
- Large tap targets (min 44px), minimal typing, camera/upload everywhere.
- Capture screen works offline-tolerant: queue uploads, show progress,
  survive the app being backgrounded.
- Ships as a PWA (installable, app icon, offline shell) once the capture and
  review screens are stable.

### Bulk review (critical — a clearance can be 80 objects)
Never 80 separate pages. A fast card/table review: multi-select → *Approve
selected* / *Ignore* / *Send to research*; inline price edits; keyboard and
swipe friendly.

### Object-detection UI
Contact-sheet view of a photo/video with bounding boxes + confidence. Tap an
object → *Create item* / *Ignore* / *Merge with…* / *Needs better photo*.
Duplicate detections across frames are auto-merged; matching sets (6 chairs)
are offered as a group.

### Review queue rules
- AI **never** auto-publishes or auto-prices a live product.
- Every AI value carries a confidence label: *High confidence* / *Likely* /
  *Possible match* / *Needs expert review*.
- Uncertain or high-value items float to the top (§9).
- AI must never invent a brand, maker, age or material, and must never alter
  or hide condition in an edited photo.

---

## 7. AI architecture

Providers change. Nothing is coupled to one model.

```
lib/ai/
  index.ts                resolves provider from env/config
  types.ts                shared result shapes + confidence labels
  providers/
    claude.ts  openai.ts  gemini.ts  mock.ts
  vision.ts               identify(objectImages, markImages?) -> Identification
  detect.ts               detectObjects(frames[]) -> Detection[]
  research.ts             findComparables(item) -> Comparable[]
  valuation.ts            value(comparables) -> Valuation
  listingWriter.ts        writeListing(item, channel) -> {title, description}
  imageEnhance.ts         enhance(photo, op) -> derived image (original kept)
```

- **`mock` provider** returns believable Memory Lane data (Bradley sideboard,
  Capodimonte-style figurine, …) so the whole workflow runs with **no API
  keys**. It is a clearly separate adapter, never mixed into production paths.
- Every call persists `ai_jobs` + `ai_results`: model, prompt version,
  confidence, cost (where available), evidence. Answerable later: *what
  produced this?*
- **Cost control (design for it, don't over-build it):** dedupe near-identical
  frames before analysis; cache results keyed by image hash + prompt version;
  cheap model for low-value/among-confident, stronger model for uncertain or
  potentially-high-value objects.

### Valuation output (never presented as guaranteed)
`Quick sale £X–£Y` · `Expected £X–£Y` · `Optimistic £Z` · `Confidence:
low/med/high` · `Based on N comparables, median £M`. Sold/completed prices
weigh far more than active asking prices.

### Profit calculator
`selling price − channel fee − postage = estimated net`. Fee rules live in
`sales_channels.config`, editable in Settings — never hard-coded permanently.

---

## 8. Sales channel adapters — and the "don't fake it" rule

**The most important integration rule in this project:** a button must never
appear to work when it doesn't.

```
lib/channels/
  types.ts          Channel, IntegrationLevel, PublishResult, SyncResult
  memoryLane.ts     full_api   — our own DB, always works
  ebay.ts           full_api   where a Sell account exists; else assisted
  etsy.ts           full_api | assisted (per-shop OAuth)
  facebook.ts       assisted   — no public listing API
  vinted.ts         assisted   — no public listing API
```

Three integration levels, shown honestly in **Settings → Integrations**:

| Level | Behaviour |
|---|---|
| **Full API** | Publish / update / mark-sold sync automatically. |
| **Assisted** | Generate every field, image and the copy; walk the user through the final manual publish step on that marketplace. |
| **Export** | Produce a complete listing package (text + images + CSV) when even assisted isn't possible. |

**Cross-channel inventory:** when a sale event arrives (webhook or manual
"mark sold"), the item goes `sold` and the engine attempts to end every other
listing. For channels it can't call, it raises an **Action Required** task:
*"Bradley sideboard sold on eBay — remove the Facebook Marketplace listing."*
Never assume a deactivation succeeded; `listings.sync_status` per channel.

**Price research sources:** eBay Browse API = *active* listings only, clearly
labelled. eBay Marketplace Insights (true sold prices) needs partner access we
don't have — until then, sold comparables are entered manually with source,
URL, price, currency, condition and date. No scraping, no circumventing
access controls, no fabricated API access.

---

## 9. Risk flags & "don't throw this away" mode

AI tags items that deserve a closer look and pushes them up the review queue:
*possible high value*, *possible precious metal*, *possible designer item*,
*possible signed artwork*, *possible antique*, *possible collectable watch*,
*hallmark detected*, *identification uncertain*.

The platform **never** certifies precious metal, authenticity or attribution
without evidence.

**Clearance Scanner** (future, but the data model allows it now): staff
photograph an area *before* items are disposed of; AI highlights objects worth
examining. `candidate_items` already supports this — a candidate with no
promoted product and a `risk_flag` is exactly this signal.

---

## 10. Permissions

`staff.role`: `admin` (everything) · `manager` (inventory, listing,
reporting) · `staff` (capture + edit assigned inventory) · `photographer`
(media + product details). Later, maybe: `partner` (external seller — one
more reason not to foreclose multi-tenancy).

Enforced at three layers: RLS policy (data), server action guard (mutation),
UI affordance (don't show what you can't do). RLS is the one that actually
protects the data.

### Open decisions for Mark (don't relitigate what's settled elsewhere)

- **D1 — SKU / naming.** Code currently mints `CMS-2026-0001` and calls the
  business "C Mac Sales" internally. The brand, domain and your master brief
  use "Memory Lane Collectables" and `ML-2026-000742` / `CLR-2026-0042`.
  Customers can see a SKU in a marketplace listing. **Recommendation:** switch
  minting to `ML-####` and `CLR-####` now (cheap — no stock exists yet), keep
  "Ceemac / C Mac" only in truly internal financial contexts. Needs your
  yes.
- **D2 — Ownership model.** Is 100% of stock owned outright, or will some be
  consignment / split? Currently one free-text field. Affects `stock_items`
  and profit reporting.
- **D3 — Reservation contact.** Email only, or also SMS? (SMS = a provider +
  cost.)
- **D4 — Photo storage.** Stay on Supabase Storage (simple, one bill) or plan
  a dedicated bucket/CDN early? Recommendation: Supabase now, revisit at
  volume.
- **D5 — "Found in <town>" on the public site.** Confirm you're comfortable
  showing the clearance town publicly (never the address). Recommendation:
  yes, town only, and make it toggleable per item.

---

## 11. Future commercial option (architect for it, don't build it)

The pipeline could later be licensed to other clearance firms, auction
houses, charity shops, house-clearance and storage companies —
*"Memory Lane AI: turn a room of second-hand goods into sale-ready
inventory."* Don't build multi-tenancy now, but avoid choices that make it
impossible: keep an `org_id` seam in mind on the core tables, keep AI
prompts/config data-driven, keep channel adapters generic.

---

## 12. Phased roadmap

Each phase ends with something demoable and, where user-facing, polished. The
first end-to-end workflow (Phase 2) matters more than breadth.

### Phase 1 — Foundations & storefront shell — ✅ mostly done
Scaffold, schema, RLS, admin auth, storefront reading `public_products`,
sitemap/robots. **Remaining:** commit `.env.example` (done), Stephen's login,
Vercel deploy, seed categories.

### Phase 1.5 — Design system & brand — ⏳ in progress (this session)
Design tokens, typography, spacing, the core component library, refreshed
public shell + homepage, empty/loading/error states. Deliverable Mark reviews
before the big build. No new features.

### Phase 2 — First end-to-end workflow (photos, not video yet)
`New Clearance → upload multiple photos → detect (mock or real) → candidate
review → approve → SKU + inventory item → publish to Memory Lane store`.
Provider abstraction + `mock` adapter so it runs with no keys. `ai_jobs` /
`ai_results` tables. This is the spine of the product.

### Phase 3 — Identification, marks & valuation
Per-item identification screen; photograph hallmarks/labels and re-run;
comparable-sales entry (manual + eBay Browse); valuation engine (quick /
expected / optimistic); profit calculator; risk flags + review-queue ordering.

### Phase 4 — Inventory operations
Locations + movements, QR generation/printing + scan-to-find, bulk status
changes, the Ready-to-List / Listed / Sold pipeline screens, old-stock
tracking.

### Phase 5 — Listings & channels
Sales-channel adapters, the per-channel listing screen with independent
prices, assisted + export flows, `Settings → Integrations` transparency,
cross-channel deactivation + Action Required tasks.

### Phase 6 — Video pipeline
Video upload → safe original storage → frame extraction → sharpness/dedupe
selection → object detection → cross-frame grouping → candidates → review.
Built on Phase 2's review UI. Async job processing with progress + retry.

### Phase 7 — Storefront depth & conversion
Full search/filter UI, collections, `/stories` editorial, reservation form +
confirmation email, "Sell to Memory Lane" with AI triage, related items,
performance pass (images, CWV, bundle size).

### Phase 8 — Reporting & pricing intelligence
Dashboard metrics, revenue/fees by channel, sell-through, days-to-sell,
clearance profitability (§ private financials), smart markdown *suggestions*
(30/60/90 days — never auto-discount without approval).

### Phase 9 — Payments (only on Mark's go)
Stripe adapter, Apple/Google Pay, orders/payments/shipments, reservation →
order upgrade. Delivery options: collection, local delivery, national
courier, furniture-delivery quote.

### Ongoing — polish & QA
After each user-facing phase: spacing, type, responsiveness, empty/loading/
error states, accessibility, mobile ergonomics. The test each time:
*would an agency put this in its portfolio? would someone believe £20k+ was
spent? can Mark or Stephen use it with no instructions, one-handed, in a
house?*

---

## 13. Code quality bar

TypeScript strict; typed config module (no scattered `process.env`); Zod (or
equivalent) validation on every form, server action and AI response; reusable
components, no 500-line files, no duplicated logic; error boundaries + loading
+ empty states as first-class; migrations for every schema change + a seed
script; no mock/fake responses in production paths (the `mock` AI adapter is
explicitly separate); no hard-coded secrets; meaningful commit messages;
tests on the money-and-data paths (SKU minting, valuation maths, cross-channel
deactivation, the public/private boundary).

---

## 14. Document map

| Doc | Purpose |
|---|---|
| `MEMORYLANE_MASTER_PLAN.md` | This file — standing architecture & roadmap. |
| `MEMORYLANE_PROGRESS.md` | Living status: done / in progress / next / blockers. |
| `DESIGN_SYSTEM.md` | Visual language, tokens, component rules. |
| `README.md` | Setup / run / deploy. |
| `supabase/migrations/*` | The schema, in order. Source of truth for the DB. |
| C-MAC SALES Claude Project | `master-requirements.md`, `database-schema.md`, `decision-log.md`, `cluzy-analysis.md` — the fuller background. |
