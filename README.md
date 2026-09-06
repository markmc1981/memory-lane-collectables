# Memory Lane Collectables

The C Mac Sales storefront and private inventory app — one Next.js app, one
Supabase database, two clearly separated areas: the public site (`/`,
`/category/*`, `/product/*`) and the staff admin app (`/admin/*`). See the
project's docs (`master-requirements.md`, `database-schema.md`,
`development-roadmap.md`, `decision-log.md`) for the full plan this
implements.

## First-time setup

1. **Create a Supabase project** at supabase.com (free tier is fine to
   start). In the SQL editor, run `supabase/migrations/0001_init.sql` once —
   this creates every table, the RLS policies, and the `public_products`
   view the storefront reads from.
2. **Create your own staff login.** In Supabase → Authentication → Users,
   add a user with your email. Then, in the SQL editor, run:
   ```sql
   insert into staff (id, name, role)
   values ('<the user's id from the Authentication tab>', 'Mark', 'owner');
   ```
   Do the same for Stephen. Nobody can sign into `/admin` until they have a
   row in `staff` — that's the access control.
3. **Copy `.env.example` to `.env.local`** and fill in the Supabase URL and
   anon key from Project Settings → API.
4. **Run it locally**:
   ```bash
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000` for the storefront, `/admin/login` for the
   staff app.
5. **Deploy to Vercel**: import this repo, set the same two environment
   variables in the Vercel project settings, and point
   `memorylanecollectables.co.uk` at it (Vercel → Domains). No build
   configuration needed beyond that — it's a standard Next.js app.

## What's actually built so far (Phase 1a/1b)

- Public storefront: home page, category pages, product pages with SEO
  metadata and `Product` structured data, `sitemap.xml`, `robots.txt` — all
  reading only from the `public_products` view, which is the sole point of
  contact between the public site and the database.
- Staff admin: email/password login (Supabase Auth), a jobs list with a
  "new job" form, per-job stock item creation with automatic sequential
  stock numbers (`CMS-2026-0001`), and a reservations list.
- Full database schema and Row Level Security from `database-schema.md`,
  including the `is_active_staff()` check that gates every private table.

## Deliberately not built yet (next phases)

- Photo capture and the AI identification/price-research review screens
  (Phase 1c/1d) — the stock item record and stock number already exist by
  the time you'd reach this step; the camera and AI review UI are the next
  piece of work.
- The customer reservation form on the product page (the button is there;
  the form and confirmation email are Phase 1f).
- QR code generation/printing, and the copy-ready manual-marketplace-listing
  generator (Phase 1g).

Nothing here should be treated as final visual design — it's plain,
functional and unstyled beyond basic layout, on purpose, so the underlying
data flow and access control could be gotten right first.
