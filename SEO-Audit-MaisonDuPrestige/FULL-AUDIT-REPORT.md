# Full SEO Audit — Maison du Prestige
**URL:** https://www.maisonduprestige.com/  
**Audit Date:** 2026-04-28  
**Auditor:** Claude SEO Audit v1.9.6  
**Business Type:** E-commerce — Luxury Watch Retailer (Morocco, COD, French-language)  
**Pages Crawled:** 50 (full sitemap)

---

## SEO Health Score: 61 / 100

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 72/100 | 22% | 15.8 |
| Content Quality | 58/100 | 23% | 13.3 |
| On-Page SEO | 44/100 | 20% | 8.8 |
| Schema / Structured Data | 65/100 | 10% | 6.5 |
| Performance (CWV) | 60/100 | 10% | 6.0 |
| AI Search Readiness | 72/100 | 10% | 7.2 |
| Images | 78/100 | 5% | 3.9 |
| **TOTAL** | | | **61.5** |

> _PageSpeed API was rate-limited during this audit. Performance score is estimated from page weight (147KB HTML) and Vercel CDN signals. Run a dedicated PageSpeed check for exact CWV values._

---

## Executive Summary

Maison du Prestige has a solid technical foundation (Vercel CDN, HTTPS, full security headers, sitemap, robots.txt, llms.txt) but is held back by **critical on-page issues affecting every product page**: titles and meta descriptions that far exceed Google's display limits, duplicate schema blocks on every page, a 404 product URL in the sitemap with spaces in the slug, and a temporary (307) non-www redirect that should be permanent.

### Top 5 Critical Issues
1. **All 43 product titles are too long** (71–114 chars vs. 60-char limit) — Google truncates and rewrites them
2. **All product meta descriptions far exceed 160 chars** (210–662 chars) — Google ignores them and auto-generates
3. **Duplicate schema + H1 on every page** — Organization, WebSite, BreadcrumbList, Product all render twice in HTML
4. **404 URL in sitemap** — `/product/Emporio Armani Renato Blue Leather Gents Watch AR11216` (spaces in slug)
5. **307 Temporary redirect** for non-www → www (should be 301/308 permanent)

### Top 5 Quick Wins
1. Fix the 404 product slug (spaces → hyphens) in Sanity — 5 minutes
2. Add `sameAs` social profiles to Organization schema — 10 minutes
3. Add `sku` field to Product schema — 15 minutes
4. Fix duplicate schema rendering — 30 minutes
5. Truncate product title template to ≤60 chars in `generateMetadata()` — 1 hour

---

## 1. Technical SEO — 72/100

### 1.1 Crawlability ✓
- **robots.txt**: Present and correct at `/robots.txt`
- Properly disallows: `/admin/`, `/studio/`, `/cart`, `/api/`
- References sitemap: `Sitemap: https://www.maisonduprestige.com/sitemap.xml` ✓
- No `Crawl-delay` directive (allows full crawl speed) ✓

### 1.2 Sitemap — 1 Critical Issue
- **50 URLs** in `/sitemap.xml` with `lastmod`, `changefreq`, `priority` ✓
- Homepage 1.0 · Collection 0.9 · Category pages 0.85 · Products 0.8 · Blog 0.7 ✓
- **CRITICAL**: 1 URL returns 404 — `https://www.maisonduprestige.com/product/Emporio Armani Renato Blue Leather Gents Watch AR11216`
  - Root cause: Sanity product slug contains spaces instead of hyphens
  - Google crawls this URL, receives 404, wastes crawl budget, logs soft 404

### 1.3 HTTPS & Security Headers ✓
All headers confirmed via `curl -sI`:

| Header | Value | Status |
|---|---|---|
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | ✓ |
| X-Content-Type-Options | nosniff | ✓ |
| X-Frame-Options | SAMEORIGIN | ✓ |
| X-XSS-Protection | 1; mode=block | ✓ |
| Referrer-Policy | strict-origin-when-cross-origin | ✓ |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() | ✓ |
| Content-Security-Policy | base-uri 'self'; form-action 'self'; frame-ancestors 'self' | Partial |

Note: `script-src` intentionally omitted from CSP (ad pixel SDKs require unsafe-inline).

### 1.4 Redirects ⚠
- **non-www → www**: `maisonduprestige.com` → `https://www.maisonduprestige.com/` returns **HTTP 307** (Temporary)
- `next.config.js` specifies `permanent: true` but Vercel serves 307 instead of 308
- Google treats 307 as temporary — link equity not fully consolidated
- Fix: Force Vercel redeploy with "Clear build cache" to pick up the latest redirect config

### 1.5 Canonical Tags ✓
- All product pages: canonical matches page URL ✓
- Homepage: `https://www.maisonduprestige.com` (no trailing slash) ✓
- Collection page: `/collection` ✓
- Blog posts: per-post canonicals ✓
- Category pages (`montres-hommes`, `montres-femmes`): not verified — should be set

### 1.6 URL Structure — 1 Issue
- Clean hyphen-separated slugs throughout ✓
- Exception: 1 product slug with spaces → 404 (see §1.2) ✗
- French-language descriptive slugs include brand + model keywords ✓

### 1.7 Server & CDN
- `x-vercel-cache: HIT` — CDN serving pre-rendered ISR pages ✓
- `x-nextjs-stale-time: 300` — 5-minute ISR revalidation window ✓
- `cache-control: public, max-age=0, must-revalidate` on HTML pages ✓
- Static assets: `max-age=31536000, immutable` ✓

---

## 2. Content Quality — 58/100

### 2.1 Homepage
- Word count: ~900 words — adequate ✓
- Sections: Hero, Trust band, Featured products, Collections, Brand story, Testimonials, CTA, Blog, Newsletter ✓
- French-language content is fluent and brand-appropriate ✓
- Missing: Casablanca/Morocco-specific buying context, price range guidance, brand comparison content

### 2.2 Product Pages
- Descriptions present in Sanity (schema `description: ✓`) ✓
- Some product names are in English ("GUESS Ladies Black Gold Tone GW0548L3") — inconsistent with French site
- Meta descriptions generated at 210–662 chars — all over limit, Google will ignore them

### 2.3 Blog Content ✓
Three published posts covering purchase-intent queries:
- "Pourquoi acheter une montre en ligne au Maroc est une bonne idée"
- "Top 5 des montres tendance pour homme au Maroc"
- "Comment choisir une montre élégante au Maroc en 2026"

BlogPosting schema, author bylines, and correct canonicals are all in place ✓

### 2.4 E-E-A-T Signals
| Signal | Status |
|---|---|
| Customer testimonials with names + cities | ✓ |
| Blog posts demonstrating product expertise | ✓ |
| sameAs social profiles in Organization schema | ✗ MISSING |
| Site-wide AggregateRating on Organization | ✗ MISSING |
| Physical address / About page | ✗ MISSING |
| Press mentions / external authority | ✗ None detected |

### 2.5 Thin Content
- No thin content pages detected
- `/pages/contact`, `/pages/politique-livraison`, `/pages/politique-retours` use short fallback text — expand when possible

---

## 3. On-Page SEO — 44/100

### 3.1 Title Tags ✗ CRITICAL — All Products Over Limit

| Page Type | Length | Status |
|---|---|---|
| Homepage | 58 chars | ✓ |
| Collection | 31 chars | ⚠ Too short/generic |
| Product pages (sample) | 71–114 chars | ✗ ALL too long |
| Blog posts | 73 chars | ⚠ Slightly over |

Product title template: `[Name] — [Price] MAD | Maison du Prestige`  
Including the price pushes most titles 15–55 chars over the limit.  
**Recommended template**: `[Product Name] | Maison du Prestige` (target ≤55 chars)

### 3.2 Meta Descriptions ✗ CRITICAL — All Products Over Limit

| Page | Length | Status |
|---|---|---|
| Homepage | 183 chars | ⚠ Slightly over (limit: ~160) |
| Collection | 120 chars | ✓ |
| Products | 210–662 chars | ✗ ALL far over limit |

Appears to be AI-generated long-form descriptions from Sanity. Google will truncate or auto-generate snippets for all product pages. Add `maxLength` validation in `generateMetadata()`.

### 3.3 Heading Structure — Duplicate Issue ✗

Every page renders all heading levels **twice** in the HTML output. Example from product page:
```
H1: "Montre MICHAEL KORS Pour Femme, MK6686"
H1: "Montre MICHAEL KORS Pour Femme, MK6686"  ← duplicate
```
Root cause: The Next.js RSC + client hydration pipeline is emitting both the server-rendered and client-side HTML into the response. Google will see 2× H1 per page — diluting heading signals and potentially triggering duplicate content flags at the element level.

Heading hierarchy (ignoring duplicates):
- H1: Primary keyword (product name / page topic) ✓
- H2: Section titles (collections, blog, testimonials, CTA) ✓
- H3: Product names, trust items, blog post titles ✓

### 3.4 Internal Linking ⚠
Homepage links to 15 internal URLs:

| Missing Link | Priority |
|---|---|
| `/collection/montres-hommes` | High — major category page |
| `/collection/montres-femmes` | High — major category page |
| Any product deeper than featured 4 | Medium |

Product pages include breadcrumb navigation ✓  
No cross-linking between related products detected from crawl sample ⚠

### 3.5 Image Alt Text
- 6 images on homepage missing `alt`
  - 4 flagged `aria-hidden="true"` (decorative watermarks) — acceptable
  - 2 images missing `alt` without `aria-hidden` — needs fixing
- Product pages: all images have alt text ✓
- Blog posts: all hero images have alt text ✓

---

## 4. Schema / Structured Data — 65/100

### 4.1 Homepage Schema — Present but Duplicated

| Type | Fields | Issues |
|---|---|---|
| Organization | name ✓, url ✓, logo ✓ | Missing: sameAs, address, telephone |
| WebSite | url ✓, potentialAction ✓ | — |
| Store | url ✓, areaServed: MA ✓, currenciesAccepted: MAD ✓ | Could add address, openingHours |
| FAQPage | 5 Q&As ✓ | — |
| **ALL TYPES** | Render twice in HTML | Critical — confuses crawlers |

### 4.2 Product Schema

| Field | Status |
|---|---|
| Product.name | ✓ |
| Product.description | ✓ |
| Product.image | ✓ |
| Product.brand.name | ✓ |
| offers.price | ✓ |
| offers.priceCurrency (MAD) | ✓ |
| offers.availability (InStock) | ✓ |
| offers.url | ✓ |
| aggregateRating | ✓ |
| sku | ✗ MISSING |
| gtin / mpn | ✗ MISSING |
| BreadcrumbList (3 levels) | ✓ but duplicated |

### 4.3 Blog Schema ✓
- BlogPosting on all 3 posts ✓
- headline, author (Person), datePublished, dateModified, publisher ✓
- publisher.logo URL hardcoded as `/logo.png` — should reference actual Sanity logo URL

### 4.4 Missing Schema Opportunities
- `ItemList` on `/collection`, `/collection/montres-hommes`, `/collection/montres-femmes`
- `AggregateRating` on Organization (site-wide rating of 4.9/5 already claimed in UI)
- `Review` objects embedded in Product schema (reviews exist in Sanity)
- `LocalBusiness` with `address` and `contactPoint` for WhatsApp

### 4.5 Duplication Root Cause
Root layout (`layout.tsx`) injects Organization + WebSite via `<JsonLd>`. Page components inject Store/FAQ/Product/BreadcrumbList via their own `<JsonLd>`. The entire HTML is being emitted twice in crawlable output — most likely a streaming + static generation artifact in the Next.js App Router producing duplicate `<script type="application/ld+json">` tags.

---

## 5. Performance — 60/100

> _Estimated — PageSpeed API rate-limited during this audit._

### 5.1 Observable Signals
| Metric | Value | Assessment |
|---|---|---|
| Homepage HTML size | 147KB | Heavy — suggests large inline data payloads |
| CDN | Vercel (x-vercel-cache: HIT) | ✓ Global edge |
| ISR revalidation | 300s | ✓ 5-min cache |
| Static asset caching | max-age=31536000, immutable | ✓ |
| Image format | Original JPG/PNG (unoptimized) | ✗ No WebP/AVIF |
| Font preloading | Playfair Display + Inter preloaded | ✓ |
| Hero image | Preloaded from Sanity CDN | ✓ |

### 5.2 Biggest Performance Risk
`images.unoptimized: true` in `next.config.js` disables all Next.js Image Optimization. Every image is served at original resolution and format. This likely causes:
- LCP image too large (full-res Sanity images without resizing)
- Extra bytes per page visit (no WebP conversion)
- No responsive `srcset` generation

**Fix**: Remove `unoptimized: true` and ensure all `<Image>` components have explicit `width`/`height` or `fill`. Sanity images should use `imageUrl(src, 1200)` for hero and `imageUrl(src, 400)` for cards (already done in code).

---

## 6. AI Search Readiness — 72/100

### 6.1 llms.txt ✓
Present at `/llms.txt`. Contains brand description, main pages, about, contact.  
**Improvements**:
- Add WhatsApp number
- List all product categories
- Add blog post URLs
- Add return policy page URL
- Add price range context ("montres de 800 à 3000 MAD")

### 6.2 AI Crawler Access ✓
GPTBot, Claude-Web, PerplexityBot not blocked in robots.txt ✓

### 6.3 Content Citability
- FAQ schema (5 Q&As) directly citable by AI Overviews ✓
- Blog posts cover specific queries AI assistants answer ✓
- Missing: Price range text in visible content (structured JSON only)
- Missing: Comparison content ("Guess vs Michael Kors", "best watch under 1500 MAD")

### 6.4 Brand Signal Strength
- Common Crawl: 0 referring domains (new domain — expected)
- No `sameAs` in Organization schema — AI cannot verify brand identity across web
- Brand name "Maison du Prestige" is distinctive ✓

---

## 7. Images — 78/100

### 7.1 Alt Text
- Homepage: 2 non-decorative images missing alt text ✗
- Products + blog: all images have alt text ✓

### 7.2 Format & Sizing
- All images unoptimized (`images.unoptimized: true`) ✗
- No WebP/AVIF conversion — significant performance loss
- Sanity CDN supports `?fm=webp` parameter for manual format negotiation
- `imageUrl()` helper already limits width (800–1200px) ✓

### 7.3 SEO
- Descriptive alt text on product images ✓
- Filenames from Sanity are asset hashes — not SEO-optimized but acceptable
- Hero images from Unsplash won't appear in brand-attributed Google Image Search

---

## 8. Backlink Profile — Not Established

- Common Crawl: **0 referring domains** in latest index
- Domain appears to be new or very recently launched
- No external link equity has accumulated yet
- Requires off-page link building strategy (not a technical issue)

---

## Appendix A: Full URL Status

| URL | HTTP | Notes |
|---|---|---|
| https://www.maisonduprestige.com | 200 | ✓ |
| https://www.maisonduprestige.com/collection | 200 | ✓ |
| https://www.maisonduprestige.com/collection/montres-hommes | 200 | ✓ |
| https://www.maisonduprestige.com/collection/montres-femmes | 200 | ✓ |
| https://www.maisonduprestige.com/blog | 200 | ✓ |
| https://www.maisonduprestige.com/pages/contact | 200 | ✓ |
| 42 product pages | 200 | ✓ |
| /product/Emporio Armani Renato... | **404** | ✗ Spaces in slug |
| 3 blog posts | 200 | ✓ |
| https://maisonduprestige.com/ | 307 | ⚠ Should be 308/301 |

## Appendix B: Schema Inventory

| Page | Schema Types | Duplicate |
|---|---|---|
| Homepage | Organization, WebSite, Store, FAQPage | ✗ All ×2 |
| Product pages | Organization, WebSite, BreadcrumbList, Product | ✗ All ×2 |
| Blog posts | Organization, WebSite, BlogPosting | ✗ All ×2 |
| Collection | Organization, WebSite | ✗ ×2 |
| Category pages | Organization, WebSite, BreadcrumbList | ✗ ×2 |
