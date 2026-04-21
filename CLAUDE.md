# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Maison du Prestige** is a Morocco-themed luxury watch e-commerce site. Target market is Moroccan customers (French-language UI, MAD currency, COD checkout, WhatsApp order confirmation). The project name in the repo is `Sitemontre`.

---

## Tech Stack

- **Framework:** Next.js (App Router, `next@^16`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS — dark luxury theme: `neutral-950` background, `amber-500` gold accent; custom `gold` color palette (DEFAULT/light/dark/muted) + `fadeIn`/`fadeInLeft`/`scaleIn`/`shimmer` animations + `shadow-luxury`/`shadow-luxury-lg`/`shadow-luxury-xl` box shadows defined in `tailwind.config.ts`
- **CMS:** Sanity v4 — content is fetched at render time with ISR (60s in dev, 300s in production)
- **Fonts:** Playfair Display (headings, `font-serif`) + Inter (body) via `next/font`
- **State:** React Context API (`CartContext`) + `localStorage` persistence
- **AI:** Groq API (via `fetch`) — powers the in-site chat widget (`llama-3.1-8b-instant`). Note: `@anthropic-ai/sdk` is listed in `package.json` but not currently used.
- **Animations:** `motion/react` (Framer Motion v12) — `<AnimateIn>` and `<StaggerIn>` wrappers in `src/components/AnimateIn.tsx`; respects `prefers-reduced-motion`
- **Package manager:** npm

There are **no tests** in this project.

---

## Development Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

Sanity Studio is embedded at `/studio` (route: `src/app/studio/[[...tool]]/`).

---

## Architecture: Sanity CMS + Local Fallbacks

Every page follows the same pattern: fetch from Sanity, fall back to hardcoded local data if Sanity is unconfigured or returns null.

```
sanityFetch(QUERY)  →  cms?.field ?? FALLBACK_VALUE
```

- **`src/sanity/env.ts`** — reads env vars (`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, etc.)
- **`src/sanity/lib/client.ts`** — lazy singleton Sanity client; uses CDN in production
- **`src/sanity/lib/fetch.ts`** — `sanityFetch<T>()` wrapper with ISR revalidation; returns `null` if Sanity is not configured (so the app works without a connected CMS)
- **`src/sanity/lib/queries.ts`** — all GROQ queries in one file; defines two product field fragments: `PRODUCT_FIELDS` (full detail, used on PDP) and `PRODUCT_CARD_FIELDS` (lighter, excludes `longDescription`, `features`, `seo` — used on listings). Also exports: `ALL_PRODUCTS_QUERY`, `RELATED_PRODUCTS_QUERY` (same category, up to 4, used on PDP), `ALL_COLLECTIONS_QUERY` (category filter UI), `SITE_SETTINGS_QUERY` (root layout), `HOME_PAGE_QUERY` (homepage), `HOMEPAGE_TESTIMONIALS_QUERY` (up to 3 testimonials, ordered by `order` field), `REVIEWS_BY_PRODUCT_QUERY` (approved reviews for a product), `ORDERS_QUERY` (admin dashboard, last 500), `ALL_POSTS_QUERY`, `POST_BY_SLUG_QUERY`, `POST_SLUGS_QUERY`, `PAGE_BY_SLUG_QUERY`, `PAGE_SLUGS_QUERY`.
- **`src/sanity/schemaTypes/`** — Sanity document schemas (`product`, `collection`, `homePage`, `siteSettings`, `page`, `review`, `order`, `post`, `homepageTestimonial`) and object schemas (`seo`, `testimonial`, `trustItem`, `navLink`, `stat`)
- **`src/data/products.ts`** — local fallback product list (8 Morocco-inspired watches) + `MOROCCAN_CITIES` array used by the checkout city dropdown
- **`src/types/index.ts`** — single source of truth for all TypeScript interfaces (`Product`, `CartItem`, `CartContextType`, `CheckoutForm`, `SiteSettings`, `HomePageData`, etc.)

`siteSettings` (fetched in the root layout) drives the Navbar and Footer — nav links, WhatsApp number, social URLs, trust badges, footer copy. The resolved `settings` prop is passed directly to `<Navbar>` and `<Footer>`.

**Root layout streaming pattern:** `src/app/layout.tsx` wraps an async `<SiteShell>` RSC (which fetches `siteSettings`) in a `<Suspense>` boundary. While the fetch is in-flight, `<LayoutSkeleton>` renders minimal nav/footer placeholders so page content streams immediately rather than blocking on the settings fetch. When adding new root-level async RSCs, follow this same Suspense + skeleton pattern.

**Sanity singletons:** `siteSettings` and `homePage` are singleton documents (one per dataset). In `sanity.config.ts` they are rendered as single-document panes with fixed document IDs, and the "Duplicate" action is removed. When adding new singleton schemas, follow the same `SINGLETONS` set pattern in `sanity.config.ts`.

---

## Server / Client Component Split

Dynamic pages use a two-file pattern to keep data-fetching on the server and interactivity on the client:

| Server (RSC) | Client |
|---|---|
| `src/app/page.tsx` | `src/app/HomeClient.tsx` |
| `src/app/collection/page.tsx` | `src/app/collection/CollectionClient.tsx` |
| `src/app/product/[slug]/page.tsx` | `src/app/product/[slug]/ProductDetailClient.tsx` |
| `src/app/admin/orders/page.tsx` | `src/app/admin/orders/OrdersDashboardClient.tsx` (loaded via `dynamic()` with `ssr: false`) |

**Exception:** `src/app/checkout/page.tsx` is a pure `'use client'` component — it reads cart state via `useCart()` and has no server-side Sanity fetch.

The server `page.tsx` fetches from Sanity and passes data as props to the `*Client.tsx` component marked `'use client'`. When adding new interactive pages follow this same split — never call `sanityFetch` from a client component.

The `@` import alias maps to `src/` (configured in `tsconfig.json`). Use `@/components/...`, `@/types`, etc.

---

## Key Flows

**Checkout:** COD only. On submit, the form POSTs to `POST /api/orders` (saves to Sanity + fires a Google Sheets webhook), then redirects the user to a pre-filled WhatsApp message. The WhatsApp number is read from `NEXT_PUBLIC_WHATSAPP_NUMBER` env var (format: `212XXXXXXXXX`). Shipping is free for orders ≥ 500 MAD, otherwise 50 MAD.

**Cart:** Managed in `CartContext` (reducer-based). Persists to `localStorage` under key `atlas-cart`. `CartBadge` component displays item count in the Navbar. All action callbacks in `CartProvider` are stable (`useCallback`) so memo'd consumers don't re-render unnecessarily.

**AI Chat Widget:** `<ChatWidget>` (in root layout) provides a floating AI assistant powered by `POST /api/chat`. The backend calls Groq (`llama-3.1-8b-instant`) with a multilingual system prompt (French, English, Darija). After 3 user messages it suggests switching to WhatsApp. Requires `GROQ_API_KEY`.

**Dynamic pages:**
- `/product/[slug]` — fetches single product by slug via `PRODUCT_BY_SLUG_QUERY`
- `/collection` — lists all products, filterable by category; filter UI is in `CollectionClient.tsx` (client component)
- `/pages/[slug]` — generic CMS-driven pages via `PAGE_BY_SLUG_QUERY`
- `/blog` — lists all published posts (RSC, no client component split needed — no interactivity)
- `/blog/[slug]` — single post page rendered with `<PortableText>` from `@portabletext/react`

**Static generation:** Product, page, and blog post slugs are pre-generated via `generateStaticParams()` using `PRODUCT_SLUGS_QUERY`, `PAGE_SLUGS_QUERY`, and `POST_SLUGS_QUERY`.

---

## Images

`src/sanity/lib/image.ts` exports `imageUrl(source, width?, quality?)` which handles both image types transparently:
- **String** → returned as-is (local fallback URLs, already-resolved CDN URLs)
- **Sanity image object** → built via `@sanity/image-url` with optional `width` and `quality=80` transforms; falls back to `source.asset.url` if builder fails

Always use `imageUrl()` when rendering product images — never assume the type. `next.config.js` sets `images.unoptimized: true` globally (Next.js Image optimization is fully disabled — no `<Image>` resizing or WebP conversion occurs). Remote patterns are still declared for `images.unsplash.com` and `cdn.sanity.io` for future use if optimization is re-enabled.

---

## Analytics & Tracking

`src/lib/tracking.ts` exports four functions: `trackPageView`, `trackViewContent`, `trackInitiateCheckout`, `trackPurchase`. All fire to Meta Pixel (`window.fbq`), TikTok Pixel (`window.ttq`), and GA4/Google Ads (`window.gtag`) when available.

Pixel IDs are resolved with a two-level priority: **Sanity `siteSettings`** fields take precedence, then **env vars** as fallback:

| Purpose | Sanity field | Env var fallback |
|---------|-------------|-----------------|
| Meta Pixel | `siteSettings.metaPixelId` | `NEXT_PUBLIC_META_PIXEL_ID` |
| TikTok Pixel | `siteSettings.tiktokPixelId` | `NEXT_PUBLIC_TIKTOK_PIXEL_ID` |
| Google Analytics | `siteSettings.googleAnalyticsId` | `NEXT_PUBLIC_GA_ID` |
| Google Ads | `siteSettings.googleAdsId` | `NEXT_PUBLIC_GADS_ID` |

`Analytics.tsx` (in root layout) injects all pixel scripts and handles route-change page views via `RouteChangeTracker`.

---

## CSS Utility Classes

`src/app/globals.css` defines component classes — use these consistently rather than inlining Tailwind:

| Class | Usage |
|-------|-------|
| `.btn-primary` | Filled amber CTA button |
| `.btn-outline` | White-bordered button |
| `.btn-ghost` | Subtle bordered button, amber on hover |
| `.section-title` | Large serif section headings |
| `.section-subtitle` | Small all-caps label above a title |
| `.card` | Dark card container (`bg-neutral-900` + border) |
| `.badge`, `.badge-gold`, `.badge-dark`, `.badge-red` | Product badges |
| `.input-field` | Form inputs and selects |
| `.text-gradient` | Gold shimmer gradient text (headings) |

---

## API Routes & Middleware

**`src/middleware.ts`** intercepts all `/api/*` requests and enforces:
- Rate limiting via Upstash Redis sliding window — requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; **falls back to allow-all if those vars are absent** (e.g. local dev without Redis). Limits: 5 review POSTs / IP / minute; 5 login attempts / IP / 15 min; 120 general API calls / IP / minute. All limits are tunable via `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_REVIEWS_MAX`, `RATE_LIMIT_LOGIN_MAX` env vars.
- SSRF guard: `/api/import-*` endpoints are restricted to same-origin callers (Sanity Studio only)
- Seed endpoint blocked in production (`/api/reviews/seed` → 404)
- Admin routes (`/admin/*`): unauthenticated requests redirected to `/admin/login`; session tokens are HMAC-SHA-256 signed (`src/lib/session.ts`) and verified with a constant-time compare

**API routes:**
- `POST /api/chat` — Groq AI chat endpoint; calls `llama3-8b-8192` via Groq's OpenAI-compatible API. Requires `GROQ_API_KEY`.
- `POST /api/orders` — saves order to Sanity (`order` doc) + fires Google Sheets webhook (URL from `siteSettings.googleSheetsWebhookUrl`). Requires `SANITY_API_WRITE_TOKEN`.
- `GET /api/orders` — lists all orders (admin-only, requires `atlas_admin` cookie).
- `PATCH /api/orders/[id]` — updates order `status` field. Requires `atlas_admin` cookie. Valid statuses: `new` | `confirmed` | `shipped` | `delivered` | `cancelled`.
- `POST /api/reviews` — creates a `review` doc (approved: false) linked to a published product. Requires `SANITY_API_WRITE_TOKEN`.
- `POST /api/import-image` — uploads an image asset to Sanity from URL (Studio-only)
- `POST /api/import-url` — imports structured data into Sanity from URL (Studio-only)
- `POST /api/test-sheets` — tests the Google Sheets webhook connection
- `POST /api/admin/login` — validates password against `ADMIN_SECRET` env var; sets `atlas_admin` httpOnly cookie (7-day TTL)
- `POST /api/admin/logout` — clears the `atlas_admin` cookie

Reviews are stored with `approved: false` and must be approved in Sanity Studio before they appear on the product page.

---

## Admin Dashboard

`/admin/login` — password-protected entry point. On success, sets the `atlas_admin` httpOnly cookie and redirects to `/admin/orders`.

`/admin/orders` — server-rendered orders dashboard (`force-dynamic`). Fetches all `order` documents from Sanity using `ORDERS_QUERY`. The page component is a RSC; interactive UI is in `OrdersDashboardClient.tsx` (client component), following the same server/client split as other pages.

`OrdersDashboardClient.tsx` uses browser APIs for filtering/sorting and is wrapped in `OrdersDashboardWrapper.tsx`.

---

## Security Headers

`next.config.js` applies these headers globally: `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/payment blocked), `Strict-Transport-Security` (2yr, includeSubDomains), and a partial CSP (`base-uri`, `form-action`, `frame-ancestors` only — `script-src` is intentionally omitted because ad pixel SDKs require `unsafe-inline`; a nonce-based policy is planned once pixels are server-rendered).

---

## Misc Components

- **`<JsonLd>`** — renders `<script type="application/ld+json">` for structured data; used in root layout for Organization and WebSite schemas.
- **`<NewsletterForm>`** — client-side only, no backend. Submitting toggles a success state without sending data anywhere.
- **`<AnimateIn>` / `<StaggerIn>`** — `motion/react` wrappers for fade-up entrance animations. Use these instead of raw `motion.div` — they handle `prefers-reduced-motion` automatically.

---

## Sanity Import Tool

The Studio includes a custom **"Importer URL"** tool (`src/sanity/tools/`) that calls the import API routes above.

---

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_READ_TOKEN=        # for read queries in server components
SANITY_API_WRITE_TOKEN=       # for /api/orders and /api/reviews write operations
NEXT_PUBLIC_WHATSAPP_NUMBER=  # format: 212XXXXXXXXX (no + or spaces)
GOOGLE_SHEETS_WEBHOOK_URL=    # Google Apps Script web app URL (doPost handler); optional — order saves succeed without it
ADMIN_SECRET=                 # password for /admin dashboard
GROQ_API_KEY=                 # required for the AI chat widget (/api/chat)
NEXT_PUBLIC_META_PIXEL_ID=    # optional — can also be set in Sanity siteSettings
NEXT_PUBLIC_TIKTOK_PIXEL_ID=  # optional — can also be set in Sanity siteSettings
NEXT_PUBLIC_GA_ID=            # optional — can also be set in Sanity siteSettings
NEXT_PUBLIC_GADS_ID=          # optional — can also be set in Sanity siteSettings

# Rate limiting (Upstash Redis) — without these, rate limiting is disabled in all environments
UPSTASH_REDIS_REST_URL=       # required to enable API rate limiting
UPSTASH_REDIS_REST_TOKEN=     # required to enable API rate limiting
# Optional rate limit overrides (defaults shown):
# RATE_LIMIT_MAX=120          # general API calls per IP per window
# RATE_LIMIT_WINDOW=60        # window duration in seconds
# RATE_LIMIT_REVIEWS_MAX=5    # review POSTs per IP per window
# RATE_LIMIT_LOGIN_MAX=5      # login attempts per IP per 15-min window
```

Without the Sanity vars, the site renders fully using local fallback data. `SANITY_API_WRITE_TOKEN` is only needed for order/review submission. `ADMIN_SECRET` is required for the `/admin` dashboard — if unset, the login API returns 503.

---

## Key Decisions

| Date       | Decision | Reason |
|------------|----------|--------|
| 2026-04-13 | Stack: Next.js 16+, TypeScript, Tailwind | User requirement |
| 2026-04-13 | Brand: Maison du Prestige — Morocco-themed luxury watches | Market: Moroccan customers, ads traffic |
| 2026-04-13 | COD only checkout, WhatsApp confirmation, MAD currency | Standard Morocco e-commerce flow |
| 2026-04-13 | Dark luxury design — neutral-950 bg, amber-500 gold accent | Premium positioning |

---

## Root-Level Non-App Directories

`agent-skills/`, `skills/`, `bencium-claude-code-design-skill/`, `ui-ux-pro-max-skill/`, `claude-marketplace/` — Claude Code skill packages at the repo root. These are **not part of the Next.js app** and should be ignored when working on the site.

---

## Open Tasks

- [ ] Set `NEXT_PUBLIC_WHATSAPP_NUMBER` env var (current fallback: `212718743726`)
- [ ] Add real product images (currently Unsplash placeholders)
- [ ] Configure `siteSettings.googleSheetsWebhookUrl` in Sanity for order logging
- [ ] Set up Vercel deployment + custom domain
- [ ] Set pixel IDs in Sanity `siteSettings` or env vars for ads tracking
- [ ] Set up CI/CD pipeline
