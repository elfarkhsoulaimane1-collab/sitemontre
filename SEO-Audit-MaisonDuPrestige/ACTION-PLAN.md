# SEO Action Plan — Maison du Prestige
**Generated:** 2026-04-28  
**Overall Score:** 40/100 → Target: 78/100 after fixes  

---

## CRITICAL — Fix Immediately (Blocking Indexing)

---

### C-1: Fix Wrong Canonical URL (All Pages)
**Impact:** Catastrophic — site cannot be indexed by Google  
**Effort:** 5 minutes  
**File:** `src/app/layout.tsx`

**Problem:** `metadataBase` is set to `https://www.atlas-watches.ma`. Every canonical link, OG URL, and structured data URL on the site points to the wrong domain.

**Fix:**
```typescript
// src/app/layout.tsx — find this line:
metadataBase: new URL('https://www.atlas-watches.ma'),

// Change to:
metadataBase: new URL('https://www.maisonduprestige.com'),
```

Also verify `src/sanity/schemaTypes/` — the `siteSettings` schema may have a `siteUrl` or similar field. Update any hardcoded `atlas-watches.ma` references.

**Verify:** After deploying, check `curl -sL https://www.maisonduprestige.com/ | grep canonical` — should show `https://www.maisonduprestige.com/`.

---

### C-2: Add robots.txt
**Impact:** High — crawl budget control, blocks admin/studio from indexing  
**Effort:** 5 minutes  
**File:** Create `src/app/robots.ts`

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/studio/', '/cart', '/api/'],
      },
    ],
    sitemap: 'https://www.maisonduprestige.com/sitemap.xml',
  }
}
```

---

### C-3: Add XML Sitemap
**Impact:** High — Googlebot can't discover all pages without it  
**Effort:** 30 minutes  
**File:** Create `src/app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/lib/fetch'
import { PRODUCT_SLUGS_QUERY, POST_SLUGS_QUERY, PAGE_SLUGS_QUERY } from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://www.maisonduprestige.com'
  
  const [products, posts, pages] = await Promise.all([
    sanityFetch<Array<{ slug: { current: string } }>>(PRODUCT_SLUGS_QUERY),
    sanityFetch<Array<{ slug: { current: string } }>>(POST_SLUGS_QUERY),
    sanityFetch<Array<{ slug: { current: string } }>>(PAGE_SLUGS_QUERY),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/collection`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pages/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productPages = (products ?? []).map(p => ({
    url: `${BASE}/product/${p.slug.current}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const postPages = (posts ?? []).map(p => ({
    url: `${BASE}/blog/${p.slug.current}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const cmsPages = (pages ?? []).map(p => ({
    url: `${BASE}/pages/${p.slug.current}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [...staticPages, ...productPages, ...postPages, ...cmsPages]
}
```

---

### C-4: Fix Duplicate H1 Tags
**Impact:** High — duplicate H1s confuse Google about page topic  
**Effort:** 30-60 minutes  
**Root cause:** Pages render H1 in both the server RSC component and the client `*Client.tsx` component

**Audit each page pair:**
- `src/app/page.tsx` + `src/app/HomeClient.tsx`
- `src/app/product/[slug]/page.tsx` + `src/app/product/[slug]/ProductDetailClient.tsx`
- `src/app/collection/page.tsx` + `src/app/collection/CollectionClient.tsx`

**Pattern to fix:** If the server page renders `<h1>Title</h1>` AND passes `title` as a prop to the client component which also renders `<h1>{title}</h1>` — remove the H1 from one of them. H1 should live in one place only.

---

### C-5: Add H1 to Homepage
**Impact:** High — homepage has no H1, missing primary keyword signal  
**Effort:** 15 minutes  
**File:** `src/app/HomeClient.tsx`

The hero section likely has a visually prominent heading. Change the outermost hero heading element from `<h2>` or `<p>` to `<h1>`. Suggested text:

```
Montres Premium au Maroc — Maison du Prestige
```
or use the `homePageData.heroTitle` from Sanity.

---

### C-6: Add H1 to Collection Page
**Impact:** High — category pages without H1 miss important keyword signals  
**Effort:** 10 minutes  
**File:** `src/app/collection/CollectionClient.tsx`

Add an H1 at the top of the page:
```tsx
<h1 className="section-title">Notre Collection de Montres</h1>
```

---

## HIGH — Fix Within 1 Week

---

### H-1: Fix All Schema URLs
**Impact:** High — schema blocks reference wrong domain, diluting entity signals  
**Effort:** 30 minutes  
**File:** `src/app/layout.tsx` (and any hardcoded schema in `JsonLd` component)

After fixing `metadataBase` (C-1), schema URLs should auto-update if they use `process.env.NEXT_PUBLIC_SITE_URL` or Next.js's metadata system. Otherwise, search for `atlas-watches.ma` in all `.tsx`/`.ts` files:

```bash
grep -r "atlas-watches.ma" src/
```
Replace every occurrence with `www.maisonduprestige.com`.

---

### H-2: Fix Duplicate Schema Blocks
**Impact:** High — Google may ignore duplicate structured data  
**Effort:** 2 hours  
**Root cause:** Same as duplicate H1 — schema is rendered in both RSC and client component

The homepage renders `Organization`, `WebSite`, and `Store` schema twice. Product pages render `Organization`, `WebSite`, and `Product` schema twice. 

**Fix:** Move all site-level schema (`Organization`, `WebSite`) to the root layout only, never in page-level components. Move `Product` schema to the server RSC page, not the client component.

---

### H-3: Add BlogPosting Schema to Blog Posts
**Impact:** High — Google News / Discover eligibility, rich results  
**Effort:** 1 hour  
**File:** `src/app/blog/[slug]/page.tsx`

```typescript
const blogPostSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.excerpt,
  "image": imageUrl(post.mainImage, 1200),
  "author": {
    "@type": "Organization",
    "name": "Maison du Prestige",
    "url": "https://www.maisonduprestige.com"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Maison du Prestige",
    "logo": { "@type": "ImageObject", "url": "https://www.maisonduprestige.com/logo.png" }
  },
  "datePublished": post._createdAt,
  "dateModified": post._updatedAt,
  "url": `https://www.maisonduprestige.com/blog/${post.slug.current}`,
  "mainEntityOfPage": `https://www.maisonduprestige.com/blog/${post.slug.current}`
}
```

---

### H-4: Fix Blog Title Tag Duplication
**Impact:** Medium — "Blog — Maison du Prestige | Maison du Prestige" duplicates brand  
**Effort:** 10 minutes  
**File:** `src/app/blog/page.tsx` (or blog metadata)

The blog index title reads: `Blog — Maison du Prestige | Maison du Prestige`

The `title` in `metadata` is likely set as a string that already includes the brand name, plus the root layout appends `| Maison du Prestige`. Use the `template` property:

```typescript
// In root layout metadata:
title: {
  template: '%s | Maison du Prestige',
  default: 'Maison du Prestige — Montres Premium au Maroc',
},

// In blog page:
export const metadata: Metadata = {
  title: 'Blog', // Will render as: "Blog | Maison du Prestige"
}
```

---

### H-5: Fix Product Title Tags
**Impact:** Medium — model code titles not searched by Moroccan customers  
**Effort:** Variable (depends on Sanity data quality)

Products like `GOLD TONE CASE GOLD TONE STAINLESS STEEL WATCH GW0033L8` should have marketing-friendly names. In Sanity Studio, edit the `name` field for each product to use user-facing names:

- ❌ `GOLD TONE CASE GOLD TONE STAINLESS STEEL WATCH GW0033L8`
- ✅ `Montre Guess Femme Dorée GW0033L8 — Boîtier Acier Inoxydable`

---

### H-6: Add llms.txt for AI Search
**Impact:** Medium-High — AI search engines (ChatGPT, Perplexity, Gemini) use this  
**Effort:** 15 minutes  
**File:** Create `public/llms.txt`

```
# Maison du Prestige — Montres Premium au Maroc

> Boutique en ligne de montres de luxe et premium au Maroc. Livraison gratuite, paiement à la livraison (COD). Spécialisée dans les montres homme et femme de marques reconnues : Guess, Michael Kors, et plus.

## Pages principales

- [Accueil](https://www.maisonduprestige.com/)
- [Collection](https://www.maisonduprestige.com/collection)
- [Blog montres Maroc](https://www.maisonduprestige.com/blog)
- [Contact](https://www.maisonduprestige.com/pages/contact)
- [Politique de livraison](https://www.maisonduprestige.com/pages/politique-livraison)

## À propos

Maison du Prestige est une boutique marocaine spécialisée dans la vente de montres premium. Nous proposons des montres authentiques avec garantie, livraison gratuite partout au Maroc pour les commandes supérieures à 500 MAD, et paiement à la livraison.

## Contact

- WhatsApp: +212 7XX XXX XXX
- Disponible en français, arabe et darija
```

---

### H-7: Fix Missing Alt Text on Images
**Impact:** Medium — accessibility + image search SEO  
**Effort:** 2-3 hours  

Search for `<img` tags without `alt` attributes across all components. Pay special attention to:
- Product card images in `<ProductCard>` component
- Gallery/carousel images on product pages
- Hero section images
- Blog post images

Every `<img>` must have a descriptive `alt` attribute. For decorative images use `alt=""`.

---

## MEDIUM — Fix Within 1 Month

---

### M-1: Create Static Category Pages
**Impact:** Medium — indexable category pages for "montres homme maroc" keywords  
**Effort:** 3-4 hours

Create static routes:
- `/collection/montres-hommes` 
- `/collection/montres-femmes`

Each with its own metadata, H1, and pre-rendered product grid. These pages can rank for high-value category keywords that the current filter URLs cannot.

---

### M-2: Add BreadcrumbList Schema
**Impact:** Medium — rich results showing navigation path in SERP  
**Effort:** 1 hour

Add to product pages:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.maisonduprestige.com/" },
    { "@type": "ListItem", "position": 2, "name": "Collection", "item": "https://www.maisonduprestige.com/collection" },
    { "@type": "ListItem", "position": 3, "name": "[Product Name]", "item": "https://www.maisonduprestige.com/product/[slug]" }
  ]
}
```

---

### M-3: Replace OG Image with Branded Asset
**Impact:** Medium — social sharing CTR (critical for Facebook/Instagram ads in Morocco)  
**Effort:** 2-3 hours

Replace:
```
https://images.unsplash.com/photo-1523275335684-37898b6baf30
```
With a branded 1200×630px image featuring the Maison du Prestige logo and a hero watch product. Upload to Sanity and reference via `siteSettings.ogImage`.

---

### M-4: Add FAQPage Schema to Key Pages
**Impact:** Medium — FAQ rich results for COD/shipping questions  
**Effort:** 2 hours

Moroccan e-commerce customers frequently search:
- "Paiement à la livraison montres maroc"
- "Livraison gratuite maroc"
- "Montre originale maroc"

Add an FAQ section to the homepage and collection page with Q&A schema.

---

### M-5: Add Author Bylines to Blog Posts
**Impact:** Medium — E-E-A-T signals for content authority  
**Effort:** 2-3 hours

Add author information to the `post` Sanity schema and display it on blog posts. Even using "Équipe Maison du Prestige" as a pseudonym author with a brief bio improves E-E-A-T signals.

---

### M-6: Server-Side Render Product List on Collection Page
**Impact:** Medium — allows Googlebot to index all products without JS  
**Effort:** 2-4 hours

The collection page renders products client-side. Convert to a hybrid approach:
- Pass initial product list from the server RSC as props
- Use client-side filtering for interactivity
- This ensures all products appear in the static HTML for Googlebot

---

### M-7: Enable Next.js Image Optimization
**Impact:** Medium — WebP conversion, proper srcset, CLS prevention  
**Effort:** 1-2 hours

`next.config.js` has `images.unoptimized: true`. While this was intentional, enabling optimization would:
- Serve WebP (30-40% smaller)
- Generate proper `srcset` for responsive images
- Prevent CLS from unspecified image dimensions

Remove `unoptimized: true` and add proper `width`/`height` or `fill` props to all `<Image>` components.

---

## LOW — Backlog

---

### L-1: Build External Backlinks
**Impact:** High long-term — new site with 0 referring domains  
**Effort:** Ongoing

Strategies for Moroccan watch market:
- Submit to Moroccan business directories (Maroc.ma, etc.)
- Partner with Moroccan influencers/bloggers
- Guest posts on Moroccan lifestyle/fashion sites
- Press releases for product launches
- Social media profiles (Instagram, Facebook, TikTok) with site link

---

### L-2: Add SearchAction Schema (Sitelinks Search Box)
**Impact:** Low — SERP enhancement for branded searches  
**Effort:** 30 minutes

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://www.maisonduprestige.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.maisonduprestige.com/collection?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### L-3: Remove Keywords Meta Tag
**Impact:** Negligible — keywords meta ignored by Google  
**Effort:** 5 minutes

The keywords meta tag (`<meta name="keywords">`) is ignored by Google and Bing. Remove it to reduce page weight and avoid any potential keyword stuffing signals.

---

### L-4: Configure Google Search Console
**Impact:** High operational — monitor indexing, errors, and performance  
**Effort:** 30 minutes

1. Go to https://search.google.com/search-console
2. Add `www.maisonduprestige.com` as a property
3. Verify ownership (easiest: DNS TXT record via Vercel/Railway)
4. Submit the sitemap URL once C-3 is done
5. Request indexing of key pages

---

### L-5: Set Up Google Analytics 4
**Impact:** Medium operational — traffic visibility  
**Effort:** 30 minutes

Set `NEXT_PUBLIC_GA_ID` env var or configure in Sanity `siteSettings.googleAnalyticsId`. The tracking infrastructure already exists in `src/lib/tracking.ts`.

---

## Estimated Score After All Critical + High Fixes

| Category | Current | After Fixes |
|----------|---------|-------------|
| Technical SEO | 18 | 75 |
| Content Quality | 55 | 68 |
| On-Page SEO | 30 | 72 |
| Schema | 40 | 75 |
| Performance | 72 | 78 |
| AI Search | 20 | 50 |
| Images | 60 | 72 |
| **Weighted Score** | **40** | **~72** |

---

## Implementation Priority Order

```
Week 1 (Day 1-2):
  ✅ C-1: Fix metadataBase (canonical URL)
  ✅ C-2: Add robots.ts
  ✅ C-3: Add sitemap.ts
  ✅ H-1: Fix schema URLs (after C-1)
  ✅ H-4: Fix blog title duplication
  ✅ H-6: Add llms.txt
  ✅ L-4: Set up Google Search Console

Week 1 (Day 3-5):
  ✅ C-4: Fix duplicate H1 tags
  ✅ C-5: Add H1 to homepage
  ✅ C-6: Add H1 to collection page
  ✅ H-2: Fix duplicate schema blocks
  ✅ H-3: Add BlogPosting schema

Week 2:
  ✅ H-5: Fix product title tags (in Sanity)
  ✅ H-7: Fix image alt text
  ✅ M-3: Replace OG image with branded asset

Month 1:
  ✅ M-1: Static category pages
  ✅ M-2: BreadcrumbList schema
  ✅ M-4: FAQ schema
  ✅ M-6: Server-side product list
  ✅ M-5: Author bylines

Ongoing:
  ✅ L-1: Backlink building
  ✅ L-5: Monitor GA4
```
