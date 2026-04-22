import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { products as localProducts } from '@/data/products'
import { sanityFetch, isSanityConfigured } from '@/sanity/lib/fetch'
import { imageUrl } from '@/sanity/lib/image'
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
  RELATED_PRODUCTS_QUERY,
  REVIEWS_BY_PRODUCT_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries'
import { Product, Review, SiteSettings } from '@/types'
import JsonLd from '@/components/JsonLd'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (isSanityConfigured()) {
    const slugs = await sanityFetch<string[]>(PRODUCT_SLUGS_QUERY) ?? []
    return slugs.map((slug) => ({ slug }))
  }
  return localProducts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  let product: Product | null | undefined = null
  if (isSanityConfigured()) {
    product = await sanityFetch<Product>(PRODUCT_BY_SLUG_QUERY, { slug })
  } else {
    product = localProducts.find((p) => p.slug === slug)
  }

  if (!product) return {}

  const title       = product.seo?.title       ?? `${product.name} — ${product.price.toLocaleString('fr-MA')} MAD`
  const description = product.seo?.description ?? product.longDescription
  const ogImage     = product.seo?.ogImage ?? imageUrl(product.images[0], 800)

  return {
    title,
    description,
    keywords: product.seo?.keywords,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 800, height: 800, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let product: Product | null | undefined = null
  let related: Product[] = []
  let reviews: Review[] = []
  let whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '212600000000'

  if (isSanityConfigured()) {
    const [p, settings] = await Promise.all([
      sanityFetch<Product>(PRODUCT_BY_SLUG_QUERY, { slug }),
      sanityFetch<SiteSettings>(SITE_SETTINGS_QUERY),
    ])
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ProductPage] slug:', slug, '| sanity result:', p ? p.slug : null)
    }
    product = p
    whatsappNumber = settings?.whatsappNumber ?? whatsappNumber
    if (product) {
      const [rel, rev] = await Promise.all([
        sanityFetch<Product[]>(RELATED_PRODUCTS_QUERY, { category: product.category, id: product.id }),
        sanityFetch<Review[]>(REVIEWS_BY_PRODUCT_QUERY, { productId: product.id }),
      ])
      related = rel ?? []
      reviews = rev ?? []
    }
  }

  // Fall back to local products when Sanity is unconfigured or returns nothing
  // (empty dataset, unpublished docs, missing/wrong read token)
  if (!product) {
    product = localProducts.find((p) => p.slug === slug) ?? null
    if (product) {
      related = localProducts
        .filter((p) => p.category === product!.category && p.id !== product!.id)
        .slice(0, 4)
    }
  }

  if (!product) notFound()

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.longDescription ?? product.description,
    image: product.images.map((img) => imageUrl(img, 800)).filter(Boolean),
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MAD',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Maison du Prestige' },
      url: `https://www.atlas-watches.ma/product/${product.slug}`,
    },
    aggregateRating: product.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }

  return (
    <>
      <JsonLd data={productSchema} />
      <ProductDetailClient
        product={product}
        related={related}
        reviews={reviews}
        whatsappNumber={whatsappNumber}
        sanityEnabled={isSanityConfigured()}
      />
    </>
  )
}
