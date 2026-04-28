# SEO Action Plan — Maison du Prestige
**Generated:** 2026-04-28 (Full Live Audit)  
**Current Score:** 61/100 → **Target: 80/100** after all fixes  
**Site:** https://www.maisonduprestige.com/

---

## Priority Legend
- 🔴 **Critical** — Blocks indexing or causes ranking penalties. Fix immediately.
- 🟠 **High** — Significant ranking impact. Fix within 1 week.
- 🟡 **Medium** — Optimization opportunity. Fix within 1 month.
- 🟢 **Low** — Nice to have. Add to backlog.

---

## 🔴 CRITICAL (Fix This Week)

### C-1 — Fix 404 product in sitemap (Spaces in slug)
**Impact:** Crawl budget waste, Google soft-404 signal  
**Effort:** 5 minutes  
**File:** Sanity Studio → Products  
**Action:** Find the product "Emporio Armani Renato Blue Leather Gents Watch AR11216" in Sanity and change its slug from `Emporio Armani Renato Blue Leather Gents Watch AR11216` to `emporio-armani-renato-blue-leather-gents-watch-ar11216`. Republish. Sitemap regenerates automatically.

---

### C-2 — Fix duplicate schema blocks on all pages
**Impact:** Confuses Googlebot, dilutes structured data signals  
**Effort:** 1–2 hours  
**File:** `src/app/layout.tsx`, page-level `<JsonLd>` calls  
**Root Cause:** Next.js App Router RSC streaming is emitting both the server-side HTML and hydration payload, causing all `<script type="application/ld+json">` tags to appear twice in the crawlable HTML.  
**Action options:**
1. In `src/components/JsonLd.tsx`, add `suppressHydrationWarning` and ensure it only renders server-side
2. Or deduplicate by checking if the schema type already exists in `<head>` before rendering
3. Or move all page-level JSON-LD into a `generateMetadata()` `other` field instead of JSX

---

### C-3 — Fix duplicate H1/H2/H3 headings on all pages
**Impact:** Dilutes heading keyword signals, potential duplicate content flag  
**Effort:** 1 hour  
**Root Cause:** Same streaming/hydration issue as C-2 — headings are rendered in both the RSC shell and the client-side hydration payload  
**Action:** Audit the RSC + client component split. Ensure the main page content (headings, body text) is in the server component (RSC) and NOT re-rendered by the client component. If `HomeClient.tsx` is rendering headings that are also in the RSC output, restructure so the RSC output includes the full HTML once.

---

### C-4 — Fix product title tags exceeding 60 characters
**Impact:** Google truncates/rewrites all 43 product titles — losing keyword control  
**Effort:** 1 hour  
**File:** `src/app/product/[slug]/page.tsx` — `generateMetadata()`  
**Current template:** `[Product Name] — [Price] MAD | Maison du Prestige` → avg 90 chars  
**Fix:** Truncate title in code:
```typescript
// In generateMetadata()
const rawTitle = `${product.name} | Maison du Prestige`
const title = rawTitle.length > 60
  ? `${product.name.slice(0, 60 - ' | Maison du Prestige'.length)} | Maison du Prestige`
  : rawTitle
```
Or better: remove price from title entirely. Price changes and makes titles dynamic (hurts caching).

---

### C-5 — Truncate product meta descriptions to ≤160 characters
**Impact:** Google ignores all product meta descriptions (210–662 chars) — loses CTR control  
**Effort:** 30 minutes  
**File:** `src/app/product/[slug]/page.tsx` — `generateMetadata()`  
**Fix:** Add truncation in `generateMetadata()`:
```typescript
const description = product.shortDescription
  ? product.shortDescription.slice(0, 155) + (product.shortDescription.length > 155 ? '...' : '')
  : `Achetez ${product.name} au Maroc. Livraison gratuite, paiement à la livraison.`
```
Also add `maxLength: 160` validation in the Sanity `seo.description` field schema.

---

### C-6 — Fix 307 redirect (non-www → www should be 308/301)
**Impact:** Link equity not fully consolidated to www domain  
**Effort:** 10 minutes  
**Action:** In Vercel dashboard → go to the project → Deployments → Redeploy latest with "Clear build cache" checked. The `next.config.js` already has `permanent: true` redirects — the 307 is likely a stale Vercel edge config from before the redirect rules were added.

---

## 🟠 HIGH (Fix Within 1 Week)

### H-1 — Add `sameAs` social profiles to Organization schema
**Impact:** Strengthens brand identity for Google Knowledge Graph and AI search engines  
**Effort:** 15 minutes  
**File:** `src/app/layout.tsx` — `organizationSchema`  
**Action:**
```typescript
sameAs: [
  'https://www.instagram.com/maisonduprestige',  // add real handles
  'https://www.facebook.com/maisonduprestige',
  'https://wa.me/212XXXXXXXXX',
]
```

---

### H-2 — Add `sku` field to Product schema
**Impact:** Required for Google Merchant Center eligibility, improves rich result eligibility  
**Effort:** 30 minutes  
**File:** `src/app/product/[slug]/page.tsx` — `productSchema`  
**Action:** Map `product.sku` (or fallback to `product.slug`) in the schema:
```typescript
sku: product.sku ?? product.slug,
```
Add `sku` field to the Sanity `product` schema if not present.

---

### H-3 — Add `ItemList` schema to collection and category pages
**Impact:** Enables product carousel rich results in Google Search  
**Effort:** 1 hour  
**Files:** `src/app/collection/page.tsx`, `src/app/collection/montres-hommes/page.tsx`, `src/app/collection/montres-femmes/page.tsx`  
**Action:**
```typescript
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Collection Maison du Prestige',
  itemListElement: products.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://www.maisonduprestige.com/product/${p.slug}`,
    name: p.name,
  }))
}
```

---

### H-4 — Fix 2 non-decorative images missing alt text on homepage
**Impact:** Accessibility + Google Image Search indexing  
**Effort:** 15 minutes  
**File:** `src/app/HomeClient.tsx`  
**Action:** Find `<img alt="" ...>` tags without `aria-hidden="true"` and add descriptive alt text.

---

### H-5 — Add internal links to category pages from homepage
**Impact:** Passes link equity to high-value category pages; helps Googlebot discover them  
**Effort:** 30 minutes  
**File:** `src/app/HomeClient.tsx` — navigation and category section  
**Action:** Add explicit `<Link href="/collection/montres-hommes">` and `<Link href="/collection/montres-femmes">` links in the hero CTA section and/or the categories grid.

---

### H-6 — Improve homepage meta description (183 → ≤160 chars)
**Impact:** Ensures Google uses your meta description instead of auto-generating  
**Effort:** 5 minutes  
**Action:** Update the fallback meta description in `src/app/page.tsx` to ≤155 chars. Also update in Sanity `homePage.seo.description`.

---

### H-7 — Update `llms.txt` with richer content
**Impact:** Better AI search discovery and citation accuracy  
**Effort:** 20 minutes  
**File:** `public/llms.txt`  
**Add:**
- WhatsApp contact number
- Product category URLs (montres-hommes, montres-femmes)
- All 3 blog post URLs with titles
- Return policy and delivery policy page URLs
- Price range context: "Montres de 800 à 3500 MAD"

---

## 🟡 MEDIUM (Fix Within 1 Month)

### M-1 — Enable Next.js Image Optimization
**Impact:** Estimated 30–50% improvement in LCP and page weight  
**Effort:** 2–4 hours  
**File:** `next.config.js`  
**Action:** Remove `unoptimized: true`. Then audit all `<Image>` components to ensure `width`/`height` or `fill` props are set. Test that Sanity CDN images render correctly after optimization is enabled.
```javascript
images: {
  // unoptimized: true  ← remove this line
  remotePatterns: [...] // keep these
}
```

---

### M-2 — Fix publisher.logo URL in BlogPosting schema
**Impact:** Correct publisher attribution in Google rich results  
**Effort:** 15 minutes  
**File:** `src/app/blog/[slug]/page.tsx`  
**Action:** Replace hardcoded `/logo.png` with actual Sanity logo URL from `siteSettings`:
```typescript
publisher: {
  '@type': 'Organization',
  name: 'Maison du Prestige',
  logo: { '@type': 'ImageObject', url: settings?.logo ?? 'https://www.maisonduprestige.com/logo.png' },
}
```

---

### M-3 — Add `AggregateRating` to Organization schema
**Impact:** Enables site-wide star rating in Google rich results  
**Effort:** 30 minutes  
**File:** `src/app/layout.tsx`  
**Action:** The brand section already claims "4.9/5 — 8,000+ clients". Back this up in schema:
```typescript
aggregateRating: {
  '@type': 'AggregateRating',
  ratingValue: '4.9',
  reviewCount: '8000',
  bestRating: '5',
}
```

---

### M-4 — Add `Review` objects to Product schema
**Impact:** Enables per-product star ratings in Google Shopping and product rich results  
**Effort:** 1 hour  
**File:** `src/app/product/[slug]/page.tsx`  
**Action:** Fetch approved reviews from Sanity (`REVIEWS_BY_PRODUCT_QUERY`) and embed them as `Review` objects in Product schema. Already fetched for display — just add to JSON-LD.

---

### M-5 — Expand collection page title and meta description
**Impact:** "Collection | Maison du Prestige" (31 chars) is too generic  
**Effort:** 15 minutes  
**File:** `src/app/collection/page.tsx` — `generateMetadata()`  
**Action:**
```typescript
title: 'Montres Homme & Femme au Maroc | Maison du Prestige',
description: 'Achetez des montres de luxe au Maroc : Guess, Michael Kors, Hugo Boss. Livraison gratuite, paiement à la livraison. Montres homme et femme authentiques.',
```

---

### M-6 — Add `LocalBusiness` / `OnlineStore` schema with contact details
**Impact:** Enables local business rich result; strengthens E-E-A-T  
**Effort:** 30 minutes  
**File:** `src/app/layout.tsx`  
**Action:** Extend the Store schema with:
```typescript
address: { '@type': 'PostalAddress', addressCountry: 'MA', addressLocality: 'Casablanca' },
contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: ['French','Arabic'] },
openingHours: 'Mo-Su 09:00-21:00',
```

---

### M-7 — Expand blog content (3 → 8+ posts)
**Impact:** More indexed pages, more keyword coverage, higher topical authority  
**Effort:** Ongoing  
**Suggested topics:**
- "Meilleures montres Guess pour homme 2026 au Maroc"
- "Montres Michael Kors femme : guide d'achat Maroc"
- "Comment entretenir sa montre de luxe"
- "Meilleurs cadeaux montres au Maroc pour moins de 1500 MAD"
- "Guide d'achat montre Hugo Boss au Maroc"

---

## 🟢 LOW (Backlog)

### L-1 — Add `gtin` / `mpn` to Product schema
**Impact:** Improves Google Shopping eligibility and product entity matching  
**Effort:** Medium (requires data collection)  
**Action:** Add GTIN/EAN/MPN data for each product in Sanity. Most watch brands publish these.

### L-2 — Set up Google Search Console
**Action:** Verify domain in GSC → submit sitemap → monitor indexation and search performance.

### L-3 — Set up Google Analytics 4
**Action:** Set `NEXT_PUBLIC_GA_ID` in Vercel environment variables. Already wired in `Analytics.tsx`.

### L-4 — Link building strategy
**Action:** Submit site to Moroccan business directories, pitch to watch review blogs, pursue brand mentions from Moroccan lifestyle media.

### L-5 — Add hreflang for Arabic variant
**Action:** If planning an Arabic (`ar`) version of the site, add `hreflang="fr"` and `hreflang="ar"` alternate links.

### L-6 — Expand static pages (About, FAQ, Press)
**Action:** Add `/pages/a-propos` with founder story, physical location context, and brand history. Add a full FAQ page beyond the homepage FAQPage schema.

---

## Implementation Roadmap

### Week 1 (Critical fixes — score impact: +10 pts)
- [ ] C-1: Fix 404 product slug in Sanity
- [ ] C-2: Fix duplicate schema blocks
- [ ] C-3: Fix duplicate H1 headings
- [ ] C-4: Truncate product titles to ≤60 chars
- [ ] C-5: Truncate meta descriptions to ≤160 chars
- [ ] C-6: Force Vercel redeploy to fix 307 redirect

### Week 2 (High priority — score impact: +8 pts)
- [ ] H-1: Add sameAs to Organization schema
- [ ] H-2: Add sku to Product schema
- [ ] H-3: Add ItemList schema to collection pages
- [ ] H-4: Fix missing alt text on 2 homepage images
- [ ] H-5: Add internal links to category pages from homepage
- [ ] H-6: Fix homepage meta description length
- [ ] H-7: Update llms.txt

### Month 1 (Medium priority — score impact: +8 pts)
- [ ] M-1: Enable Next.js Image Optimization
- [ ] M-2: Fix BlogPosting publisher.logo
- [ ] M-3: Add AggregateRating to Organization
- [ ] M-4: Add Review objects to Product schema
- [ ] M-5: Improve collection page meta
- [ ] M-6: Add LocalBusiness schema with address
- [ ] M-7: Publish 5 new blog posts

### Ongoing (Low priority)
- [ ] L-1: Add GTIN/MPN to products
- [ ] L-2: Google Search Console setup
- [ ] L-3: Google Analytics 4
- [ ] L-4: Link building
- [ ] L-6: Expand static pages

---

## Expected Score Progression

| Milestone | Score |
|---|---|
| Current | 61/100 |
| After Week 1 (Critical fixes) | ~71/100 |
| After Week 2 (High priority) | ~76/100 |
| After Month 1 (Medium priority) | ~82/100 |
| After full backlog | ~88/100 |
