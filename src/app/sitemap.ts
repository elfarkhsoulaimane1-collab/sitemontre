import { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/lib/fetch'
import { PRODUCT_SLUGS_QUERY, POST_SLUGS_QUERY, PAGE_SLUGS_QUERY } from '@/sanity/lib/queries'

const BASE = 'https://www.maisonduprestige.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, pages] = await Promise.all([
    sanityFetch<string[]>(PRODUCT_SLUGS_QUERY),
    sanityFetch<string[]>(POST_SLUGS_QUERY),
    sanityFetch<string[]>(PAGE_SLUGS_QUERY),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/collection`,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/collection/montres-hommes`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/collection/montres-femmes`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE}/blog`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/pages/contact`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  const productPages = (products ?? []).map((slug) => ({
    url: `${BASE}/product/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const postPages = (posts ?? []).map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const cmsPages = (pages ?? []).map((slug) => ({
    url: `${BASE}/pages/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [...staticPages, ...productPages, ...postPages, ...cmsPages]
}
