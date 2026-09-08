# Memory Lane Collectables — Design System

> The visual language for both surfaces. The public storefront should feel
> like a modern antiques gallery — calm, warm, editorial, spacious, photo-led.
> The operations app uses the same tokens and primitives but denser and
> faster. Neither should look like a generic SaaS product.
>
> Status: **v0.1 — foundations in place, for review.** Tokens, type, and the
> core primitives exist and are wired into the storefront. Not yet done:
> real photography, favicon/OG image, the operations-app screens, dark mode.

---

## Principles

1. **Restraint.** One accent colour. Small radii. Almost no shadow. No
   gradients. Movement only where it aids understanding.
2. **The photograph leads.** Product imagery is the loudest thing on any
   page. Chrome around it stays quiet — a hairline, not a card with a shadow.
3. **Editorial, not corporate.** A real serif for display type, generous
   line-height, a measured column width, proper typographic detail
   (balanced headings, en-dashes, £ without trailing `.00`).
4. **Warm, not cold.** Nothing is pure white or pure black. The palette is
   built on warm paper and warm ink.
5. **Mobile is not the small version — it's the primary version** for the
   operations app. One-handed reach, 44px minimum targets, camera-first.

### Explicitly avoid
Excessive gradients · generic SaaS dashboards · walls of text · cheap icon
sets · rounded cards everywhere · gratuitous animation · clutter · five badge
colours on one screen · anything that reads as "AI-generated".

---

## Tokens

All tokens live in `app/globals.css` under `@theme` (Tailwind v4). Use the
generated utilities (`bg-paper`, `text-ink`, `border-line`, `font-display`,
`text-2xl`, `rounded-lg`) — never hard-coded hex values in components.

### Colour

| Token | Value | Use |
|---|---|---|
| `paper` | `#f6f3ec` | Page background |
| `surface` | `#fffefb` | Cards, raised areas, footer |
| `surface-sunk` | `#efeae0` | Image placeholders, wells |
| `ink` | `#211f1b` | Primary text, headings |
| `ink-soft` | `#4f4a41` | Body copy, secondary text |
| `muted` | `#756e62` | Captions, metadata, overlines |
| `line` | `#e2dacb` | Hairlines, borders, inputs |
| `line-soft` | `#ece6da` | Faint internal dividers |
| `accent` | `#3f4d3a` | Primary buttons, links, focus ring — deep desaturated green |
| `accent-hover` | `#333f30` | Primary button hover |
| `accent-tint` | `#e9ece3` | Quiet accent background (newsletter band) |
| `on-accent` | `#f6f3ec` | Text/icons on accent |
| `highlight` | `#a2543b` | Warm rust — **sparingly**: sale, "reserved", small emphasis |
| `highlight-tint` | `#f2e4dd` | Background for highlight badges |
| `positive` / `critical` | `#3f6b4a` / `#9c3b34` | Status only (operations app) |

Light mode only for now. Dark mode is a later addition — when it comes, it
redefines these tokens under `@media (prefers-color-scheme: dark)` and a
`[data-theme]` override; components must not need changing.

### Typography

- **Display** — [Fraunces](https://fonts.google.com/specimen/Fraunces)
  (`--font-display`). Nostalgic-but-modern serif. Weights 400–600, italic
  available. All `h1`–`h4` default to it. Headings: `line-height: 1.12`,
  `letter-spacing: -0.012em`, `text-wrap: balance`.
- **Sans** — [Inter](https://fonts.google.com/specimen/Inter)
  (`--font-sans`). Body, UI, labels. Body: 16px / 1.6, `-0.005em` tracking.
- **Overline** — `.overline` utility: 11px, 600, `0.14em` tracking,
  uppercase, `muted`. The small label above headings and on cards.
- **`.prose-warm`** — long-form body: `max-width: 62ch`, `ink-soft`, 1.7
  line-height, paragraph spacing.

Type scale (`--text-*`): 11 · 12 · 14 · 16 · 18 · 22 · 28 · 36 · 48 · 60 px.

### Space, radius, elevation

- Spacing: Tailwind's 4px scale. Section rhythm on the storefront:
  `py-16 sm:py-20` (≈64–80px), hero `py-16 sm:py-24`.
- Radius: `sm` 2px · **default 3px** · `lg` 6px · `full`. Buttons use
  default; cards/images use default or `lg`. No pills except badges.
- Elevation: `shadow-sm` (barely visible) for the odd raised input;
  `shadow-md` for overlays/menus only. Product cards have **no** shadow.

### Motion

`--ease` = `cubic-bezier(0.4, 0, 0.2, 1)`. Durations 150ms (UI) – 500ms
(image hover scale). All motion is disabled under
`prefers-reduced-motion`.

---

## Primitives

Location: `components/ui/*` (shared UI) and `components/site/*` (storefront
chrome). `lib/ui/` holds non-visual helpers (`clsx`, `format`).

| Component | Notes |
|---|---|
| `Container` | Page gutter + max width. `width="prose" \| "default" \| "wide"`. `px-5 sm:px-8`. |
| `Button` | Variants `primary` / `secondary` / `ghost` / `link`; sizes `sm` / `md` / `lg`. Polymorphic — pass `href` to render a `next/link`. |
| `Badge` | Tones `neutral` / `accent` / `highlight` / `positive` / `critical`. Uppercase, tracked, pill. Condition + status labels. |
| `ProductCard` | 4:5 image, hairline, hover image-scale, overline category, serif title, price (strikethrough if sold). The storefront workhorse. |
| `EmptyState` | Dashed border, serif title, optional body + action. Reassuring, not broken-looking. |
| `PageHeader` (site) | Kicker + serif H1 + optional lede, bottom hairline. Content/editorial pages. |
| `SiteHeader` / `SiteFooter` (site) | Sticky translucent header with primary nav + mobile category scroller; 4-column footer. |

### Patterns not yet built (specified for later)
- Form field set (`Field`, `Select`, `Textarea`, `RadioGroup`) with inline
  validation — currently ad-hoc inline inputs.
- `Price` / valuation range display component.
- Skeleton loaders (image blocks, card grids, table rows).
- Toast / inline form-error surface (server-action failures currently only
  hit server logs — see `MEMORYLANE_PROGRESS.md`).
- Operations-app shell: bottom action bar (mobile), dense list rows,
  the bulk-review card/table, the object-detection contact sheet.
- Icon set: **Lucide**, used minimally (nav, status, actions) — not
  decoratively.

---

## Imagery

- Product photography is the brand. Until real photos exist, placeholders are
  a plain `surface-sunk` block — never a stock photo, never a gradient.
- Aspect ratios: product cards **4:5**, product hero **4:5**, editorial **3:2**,
  homepage hero image **4:3 → square** on large screens.
- Every image needs real `alt` text. For products this comes from the item
  title + key attributes (part of the AI listing pipeline, `MEMORYLANE_MASTER_PLAN.md` §7).
- Serve WebP/AVIF, lazy-load below the fold, use `next/image` once images are
  real (placeholders use plain `<img>` / divs today).

---

## Accessibility

- Focus-visible ring on everything interactive (`2px accent`, `2px` offset) —
  defined globally, don't remove it.
- Colour contrast: `ink` / `ink-soft` on `paper` and `surface` all exceed
  WCAG AA. `muted` is for non-essential text only.
- Hit targets ≥ 44px in the operations app; ≥ 40px on the storefront.
- Semantic landmarks (`header` / `main` / `footer` / `nav`), one `h1` per
  page, ordered headings.
- Test with keyboard-only and at 200% zoom before calling a screen done.
