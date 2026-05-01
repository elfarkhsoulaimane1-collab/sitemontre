import { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/lib/fetch'

const BASE = 'https://maisonduprestige.com'

interface SitemapEntry { slug: string; _updatedAt: string }

const PRODUCT_SLUGS_WITH_DATE_QUERY = /* groq */ `
  *[_type == "product" && defined(slug.current)][]{
    "slug": slug.current,
    _updatedAt
  }
`

const POST_SLUGS_WITH_DATE_QUERY = /* groq */ `
  *[_type == "post" && defined(slug.current) && defined(publishedAt)][]{
    "slug": slug.current,
    _updatedAt
  }
`

const PAGE_SLUGS_WITH_DATE_QUERY = /* groq */ `
  *[_type == "page" && defined(slug.current)][]{
    "slug": slug.current,
    _updatedAt
  }
`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, pages] = await Promise.all([
    sanityFetch<SitemapEntry[]>(PRODUCT_SLUGS_WITH_DATE_QUERY),
    sanityFetch<SitemapEntry[]>(POST_SLUGS_WITH_DATE_QUERY),
    sanityFetch<SitemapEntry[]>(PAGE_SLUGS_WITH_DATE_QUERY),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/collection`,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/collection/montres-hommes`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/collection/montres-femmes`,    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/blog`,                         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/pages/contact`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productPages = (products ?? [])
    .filter((p): p is SitemapEntry => !!p?.slug && !/[\s%]/.test(p.slug))
    .map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const postPages = (posts ?? [])
    .filter((p): p is SitemapEntry => !!p?.slug)
    .map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  const cmsPages = (pages ?? [])
    .filter((p): p is SitemapEntry => !!p?.slug)
    .map((p) => ({
      url: `${BASE}/pages/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }))

  return [...staticPages, ...productPages, ...postPages, ...cmsPages]
}
