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
    sitemap: 'https://maisonduprestige.com/sitemap.xml',
  }
}
