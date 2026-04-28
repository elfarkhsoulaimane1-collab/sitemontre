# SEO Audit Report — Maison du Prestige
**URL:** https://www.maisonduprestige.com/  
**Audit Date:** 2026-04-28  
**Business Type:** E-commerce — Luxury Watches (Moroccan Market)  
**Language:** French (fr)  
**Framework:** Next.js (App Router) on Railway + Fastly CDN  

---

## Overall SEO Health Score: 40 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 18/100 | 4.0 |
| Content Quality | 23% | 55/100 | 12.7 |
| On-Page SEO | 20% | 30/100 | 6.0 |
| Schema / Structured Data | 10% | 40/100 | 4.0 |
| Performance (CWV) | 10% | 72/100 | 7.2 |
| AI Search Readiness | 10% | 20/100 | 2.0 |
| Images | 5% | 60/100 | 3.0 |
| **TOTAL** | **100%** | — | **38.9 ≈ 40** |

> ⚠️ Score is critically depressed by the canonical URL misconfiguration, which alone renders the entire domain effectively unintelligible to Google.

---

## Executive Summary

### Top 5 Critical Issues

1. **Wrong canonical URL on every page** — ALL pages point canonical to `https://www.atlas-watches.ma` (the old dev domain). Google will not index `maisonduprestige.com`.
2. **No XML sitemap** — `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-0.xml` all return 404.
3. **No robots.txt** — Returns 404; Google sees this as a missing file and treats the site as uncontrolled.
4. **Duplicate H1 tags** — Product, blog, and policy pages each render their H1 twice (SSR + CSR hydration duplication).
5. **Missing H1 on Homepage and Collection page** — The two highest-traffic pages have no H1.

### Top 5 Quick Wins

1. Fix `metadataBase` in `src/app/layout.tsx` — change from `https://www.atlas-watches.ma` to `https://www.maisonduprestige.com` (1 line fix).
2. Add `src/app/sitemap.ts` — Next.js built-in sitemap generation (30 min).
3. Add `src/app/robots.ts` — Next.js built-in robots.txt (5 min).
4. Add `public/llms.txt` — AI crawler guidance file (10 min).
5. Add a meaningful H1 to the homepage hero section (15 min).

---

## 1. Technical SEO

### 1.1 Crawlability

| Check | Status | Notes |
|-------|--------|-------|
| robots.txt | ❌ MISSING | Returns HTTP 404 |
| XML Sitemap | ❌ MISSING | All variants return 404 |
| HTTP → HTTPS redirect | ✅ PASS | 301 redirect in place |
| HTTP/2 | ✅ PASS | HTTP/2 confirmed |
| CDN | ✅ PASS | Fastly (via Railway) |
| ISR/Caching | ✅ PASS | `s-maxage=60, stale-while-revalidate=31535940` |

**robots.txt missing:** Googlebot receives a 404 when fetching `/robots.txt`. While this doesn't block crawling, it prevents you from controlling crawl budget and blocking unwanted sections (e.g., `/cart`, `/admin`, `/studio`).

**Sitemap missing:** Next.js 13+ supports automatic sitemap generation via `src/app/sitemap.ts`. Without one, Googlebot must discover all pages by following links — missing any orphaned or deep pages.

### 1.2 Indexability

| Check | Status | Notes |
|-------|--------|-------|
| Meta robots (homepage) | ✅ index, follow | Correct |
| Canonical URL | ❌ CRITICAL | Points to wrong domain on ALL pages |
| HTTPS enforced | ✅ PASS | HSTS 2yr + preload |

**CANONICAL CRISIS — Most Critical Issue:**  
Every page on `www.maisonduprestige.com` contains:
```html
<link rel="canonical" href="https://www.atlas-watches.ma/..." />
```
This signals to Google that the "true" version of every page lives at `atlas-watches.ma`. As a result:
- Google will NOT index `maisonduprestige.com`
- Any link equity earned by `maisonduprestige.com` is attributed to `atlas-watches.ma`
- The domain may be completely deindexed

**Root cause:** `metadataBase` in `src/app/layout.tsx` is set to `https://www.atlas-watches.ma` (the old staging domain). Changing this to `https://www.maisonduprestige.com` will fix canonicals on all pages instantly.

### 1.3 Security Headers

| Header | Status |
|--------|--------|
| Strict-Transport-Security | ✅ 2yr + includeSubDomains + preload |
| X-Frame-Options: SAMEORIGIN | ✅ Present |
| X-Content-Type-Options: nosniff | ✅ Present |
| X-XSS-Protection | ✅ Present |
| Referrer-Policy | ✅ strict-origin-when-cross-origin |
| Permissions-Policy | ✅ Present |
| Content-Security-Policy | ⚠️ Partial only (no script-src) |

Security headers are well-configured. The partial CSP is a known tradeoff documented in CLAUDE.md.

### 1.4 URL Structure

| Check | Status |
|-------|--------|
| Lowercase URLs | ✅ Consistent |
| Hyphens as separators | ✅ Consistent |
| Query parameters for filters | ⚠️ `/collection?category=montres-hommes` — not crawlable as distinct pages |
| Dynamic params | ✅ `/product/[slug]`, `/blog/[slug]` |

**Category pages not indexable:** The filter URLs (`/collection?category=montres-hommes`) are applied client-side. There are no static `/collection/montres-hommes` pages. This is a missed keyword opportunity.

---

## 2. On-Page SEO

### 2.1 Title Tags

| Page | Title | Length | Issue |
|------|-------|--------|-------|
| Homepage | Maison du Prestige — Montres Premium au Maroc | 46 chars | ✅ Good |
| Collection | Collection \| Maison du Prestige | 32 chars | ⚠️ Generic, no keywords |
| Product (watch 1) | GOLD TONE CASE GOLD TONE STAINLESS STEEL WATCH GW0033L8 — 1.199 MAD \| Maison du Prestige | 91 chars | ❌ Too long, model code only |
| Product (watch 2) | Guess Continental chocolate en cuir pour homme — 1.300 MAD \| Maison du Prestige | 82 chars | ⚠️ Slightly long |
| Blog index | Blog — Maison du Prestige \| Maison du Prestige | 47 chars | ❌ Brand name duplicated |
| Blog post | Top 5 des montres tendance pour homme au Maroc — Maison du Prestige \| Maison du Prestige | 90 chars | ❌ Too long, brand duplicated |
| Contact | Contactez-nous \| Maison du Prestige | 36 chars | ✅ OK |
| Politique livraison | Politique de Livraison \| Maison du Prestige | 44 chars | ✅ OK |

**Blog title duplication:** The brand name `Maison du Prestige` appears twice — once from the page title and once appended by the template. This needs a fix in the blog metadata generation.

**Product title issue:** Some products use raw model codes (e.g., `GW0033L8`) as page titles. These are not search terms Moroccan customers use.

### 2.2 Meta Descriptions

| Page | Status | Notes |
|------|--------|-------|
| Homepage | ✅ Good | 107 chars, includes keywords |
| Collection | ✅ Good | Mentions MAD, Maroc, livraison |
| Product pages | ⚠️ Variable | Some use raw model descriptions |
| Blog index | ✅ OK | |
| Blog posts | ✅ Good | Keyword-rich |

### 2.3 Heading Structure

| Page | H1 | Issue |
|------|----|-------|
| Homepage | ❌ EMPTY | No visible H1 text |
| Collection | ❌ MISSING | H1 not rendered |
| Product pages | ❌ DUPLICATED | H1 appears twice in HTML |
| Blog index | ✅ "Le Blog" (duplicated) | H1 exists but rendered twice |
| Blog posts | ✅ Present (duplicated) | H1 rendered twice |
| Contact | ✅ "Contactez-nous" | Single H1, correct |

**Duplicate H1 cause:** The SSR-rendered H1 and the client-hydrated H1 are both present in the page source. This is likely caused by a component that renders in both the server RSC shell and the client `*Client.tsx` component. Each page effectively has 2 H1 tags, which is an SEO signal problem.

**Homepage H1:** The hero section has a visually prominent heading but it's wrapped in an element that is not `<h1>`. This is a missed primary keyword opportunity.

---

## 3. Content Quality

### 3.1 Homepage Content

**Strengths:**
- French language matches target audience ✅
- Moroccan context (MAD, livraison, COD) ✅
- Trust signals: testimonials, badges ✅
- Blog articles section signals content depth ✅

**Weaknesses:**
- No H1 heading for semantic anchor ❌
- Sections like "Bestsellers & Deals" and "Articles & Conseils" appear twice in the H2 list — likely double rendering ⚠️
- OG image is a generic Unsplash watch photo, not a branded asset ⚠️

### 3.2 Product Pages

**Strengths:**
- Product descriptions exist in French ✅
- Price prominently in title ✅
- Customer reviews with ratings ✅
- Brand attribution (e.g., Guess) ✅

**Weaknesses:**
- Some product names are model codes not user search terms ❌
- Meta descriptions are cut from raw spec data ⚠️
- No long-form editorial content for rich E-E-A-T signals ⚠️

### 3.3 Blog Content

3 blog posts found:
- "Pourquoi acheter une montre en ligne au Maroc est une bonne idée"
- "Top 5 des montres tendance pour homme au Maroc"
- "Comment choisir une montre élégante au Maroc en 2026"

These are well-optimized Moroccan-market keywords. The blog exists but:
- No Article/BlogPosting schema markup ❌
- Blog index title has brand duplication bug ❌
- Raw word count ~1,243 for sample post (acceptable, but longer posts rank better) ⚠️

### 3.4 E-E-A-T Assessment

| Signal | Status |
|--------|--------|
| Author attribution | ❌ No author bylines on blog posts |
| About/brand story page | ❌ Not found |
| Physical address | ❌ Not present in schema or pages |
| Phone number | ⚠️ WhatsApp only (acceptable for Morocco) |
| Business registration | ❌ No visible legal/company info |
| Customer reviews | ✅ Present on product pages |
| Social proof | ✅ Testimonials section on homepage |
| SSL/security | ✅ Full HTTPS + HSTS |

---

## 4. Schema / Structured Data

### 4.1 Current Schema (Homepage)

| Type | URL in Schema | Issues |
|------|---------------|--------|
| Organization | https://www.atlas-watches.ma | ❌ Wrong URL |
| WebSite | https://www.atlas-watches.ma | ❌ Wrong URL |
| Store | https://www.atlas-watches.ma | ❌ Wrong URL, **duplicated** |

### 4.2 Product Page Schema

| Type | Status | Details |
|------|--------|---------|
| Organization | ✅ Present | ❌ Wrong URL, duplicated |
| WebSite | ✅ Present | ❌ Wrong URL, duplicated |
| Product | ✅ Present | ❌ Wrong URL, **duplicated** |

**Product schema strengths:**
- `name`, `description`, `image` ✅
- `price`, `priceCurrency: MAD` ✅
- `availability: InStock` ✅
- `aggregateRating` with `ratingValue`, `reviewCount` ✅
- `brand` with `Brand` type ✅

**Product schema weaknesses:**
- Every schema block appears twice (duplication bug) ❌
- Product URL in schema points to atlas-watches.ma ❌
- No `sku` or `gtin` fields ⚠️
- No `Review` array (only aggregate) ⚠️

### 4.3 Blog Schema

| Type | Status |
|------|--------|
| Article / BlogPosting | ❌ MISSING |
| Author | ❌ MISSING |
| datePublished / dateModified | ❌ MISSING |

Blog posts have no specific schema beyond the site-level Organization and WebSite blocks.

### 4.4 Missing Schema Opportunities

| Schema Type | Priority | Benefit |
|-------------|----------|---------|
| BreadcrumbList | High | Rich results in SERP |
| FAQPage | Medium | SERP feature — common for Moroccan COD questions |
| Article on blog posts | High | Google News / Discover eligibility |
| LocalBusiness with address | Medium | Local SEO signals |
| SearchAction (Sitelinks search box) | Low | Site search in SERP |

---

## 5. Performance

**Measurements (lab, from Europe):**

| Metric | Value | Rating |
|--------|-------|--------|
| DNS lookup | 2.5ms | Excellent |
| TCP + TLS connect | 184ms | Good (CDN in Europe) |
| Time to First Byte (TTFB) | 281ms | Acceptable |
| Total HTML transfer | 377ms | Good |
| HTML size | 142 KB | ⚠️ Large for HTML |
| Download speed | 378 KB/s | Good |
| HTTP version | HTTP/2 | ✅ |

**JavaScript loading:**
- 13 script tags (12 async, 0 deferred)
- 1 stylesheet
- 4 preloads (2 fonts, 1 image, 1 script)

**Good:**
- Most scripts are async ✅
- Fonts preloaded ✅
- CDN in place (Fastly/Railway) ✅
- ISR caching enabled ✅

**Concerns:**
- 142 KB HTML is large — suggests significant inline JS from Next.js hydration ⚠️
- No Core Web Vitals field data available (no Google API credentials configured) ⚠️
- PageSpeed API rate-limited during audit — run manually at https://pagespeed.web.dev/ ⚠️

---

## 6. Images

| Check | Status | Details |
|-------|--------|---------|
| Images without alt text | ❌ 6–7 per page | Accessibility + SEO issue |
| OG/social image | ⚠️ Unsplash stock photo | Not branded |
| Product images | ✅ Sanity CDN | Good |
| Image optimization | ⚠️ `images.unoptimized: true` | Next.js optimization disabled |
| Responsive images | ❓ Unknown without field data | |
| Logo image | ✅ Sanity CDN preloaded | |

**OG Image:** `https://images.unsplash.com/photo-1523275335684-37898b6baf30` — a generic watch stock photo. Social sharing will show a non-branded image, reducing CTR on Facebook/Instagram (critical for Moroccan audience).

**Image alt text:** Multiple product images, gallery images, and decorative images lack `alt` attributes. This impacts both accessibility (WCAG) and image search SEO.

---

## 7. AI Search Readiness (GEO)

| Signal | Status |
|--------|--------|
| llms.txt | ❌ MISSING (404) |
| Robots.txt AI crawler directives | ❌ No robots.txt |
| Structured, citable content | ⚠️ Minimal editorial depth |
| Author bylines | ❌ Missing |
| Factual, reference-quality content | ⚠️ Product focus, limited authority content |
| Brand mentions / citations | ❌ No referring domains in Common Crawl |
| AI overview optimization | ❌ No FAQ or Q&A schema |

**Common Crawl data:** `maisonduprestige.com` has **0 referring domains** in the Common Crawl dataset (Jan–Mar 2026). The site is new and has no external backlink profile. PageRank and Harmonic Centrality are both null.

---

## 8. Backlink Profile

| Source | Data |
|--------|------|
| Common Crawl (2026 Q1) | 0 referring domains |
| Moz DA/PA | Not available (no API key) |
| Bing Webmaster | Not available (no API key) |

The site appears brand new with no external links. This significantly limits its ability to rank for competitive keywords until authority is built.

---

## 9. Site Structure & Crawl Map

**Pages discovered:**

| URL | Type | Status |
|-----|------|--------|
| / | Homepage | ✅ Live |
| /collection | Category | ✅ Live (CSR — products not in HTML) |
| /collection?category=montres-hommes | Filter | ⚠️ Client-side only |
| /collection?category=montres-femmes | Filter | ⚠️ Client-side only |
| /product/[slug] | Product | ✅ Live (4 discovered) |
| /blog | Blog index | ✅ Live |
| /blog/[slug] | Blog post | ✅ Live (3 posts) |
| /pages/contact | Contact | ✅ Live |
| /pages/politique-livraison | Policy | ✅ Live |
| /pages/politique-retours | Policy | ✅ Live |
| /cart | Cart | ✅ Live (no SEO value) |
| /sitemap.xml | — | ❌ 404 |
| /robots.txt | — | ❌ 404 |
| /llms.txt | — | ❌ 404 |

**Collection page note:** The `/collection` page renders products client-side via React. Only 4 product links are discoverable by Googlebot in the static HTML. This means most products may not be indexed unless they have other entry points.

---

## Appendix: Raw Findings

### Canonical URLs Observed

| Page | Canonical Set |
|------|--------------|
| / | https://www.atlas-watches.ma |
| /collection | https://www.atlas-watches.ma/collection |
| /product/[slug] | https://www.atlas-watches.ma/product/[slug] |
| /blog | https://www.atlas-watches.ma |
| /blog/[slug] | https://www.atlas-watches.ma |
| /pages/contact | https://www.atlas-watches.ma |
| /pages/politique-livraison | https://www.atlas-watches.ma |

### HTTP Response Headers (HTTPS)

```
HTTP/2 200
cache-control: s-maxage=60, stale-while-revalidate=31535940
content-security-policy: base-uri 'self'; form-action 'self'; frame-ancestors 'self'
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-nextjs-cache: HIT
x-xss-protection: 1; mode=block
```
