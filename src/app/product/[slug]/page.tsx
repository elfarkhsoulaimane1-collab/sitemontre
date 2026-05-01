import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { products as localProducts } from '@/data/products'
import { PRODUCT_STATIC_FAQS } from '@/data/product-faqs'
import { sanityFetch, isSanityConfigured } from '@/sanity/lib/fetch'
import { imageUrl } from '@/sanity/lib/image'
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_SLUGS_QUERY,
  RELATED_PRODUCTS_QUERY,
  REVIEWS_BY_PRODUCT_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries'
import { Product, ProductFaqItem, Review, SiteSettings } from '@/types'
import JsonLd from '@/components/JsonLd'
import ProductDetailClient from './ProductDetailClient'

export const revalidate = 300
export const dynamicParams = true

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  if (isSanityConfigured()) {
    const slugs = await sanityFetch<string[]>(PRODUCT_SLUGS_QUERY) ?? []
    return slugs.filter(Boolean).map((slug) => ({ slug }))
  }
  return localProducts.map((p) => ({ slug: p.slug }))
}

function buildDescription(product: Product): string {
  if (product.seo?.description) {
    const d = product.seo.description
    return d.length <= 160 ? d : d.slice(0, 157).trimEnd() + '...'
  }

  const keyword = product.category === 'luxury' || product.category === 'classic'
    ? 'montre homme Maroc'
    : product.category === 'sport'
    ? 'montre sport Maroc'
    : 'montre femme Maroc'

  const cta = 'Livraison gratuite, paiement à la livraison.'

  // Build: "Achetez [name] — [keyword]. [short desc]. [cta]"
  const base = `Achetez ${product.name} — ${keyword}. ${cta}`
  if (base.length <= 160) return base

  // Fallback: strip name to fit
  const prefix = `Achetez `
  const suffix = ` — ${keyword}. ${cta}`
  const nameAllowance = 160 - prefix.length - suffix.length
  const name = nameAllowance > 10
    ? product.name.slice(0, nameAllowance).trimEnd()
    : product.name
  return `${prefix}${name}${suffix}`.slice(0, 160)
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

  const SUFFIX = ' | Maison du Prestige'
  const HOMME_CATS = new Set(['luxury', 'classic', 'sport', 'montres-hommes', 'homme'])
  const genre = HOMME_CATS.has(product.category) ? 'Homme' : 'Femme'

  const rawTitle = product.seo?.title ?? product.name
  const hasGenre = /homme|femme/i.test(rawTitle)
  const core = hasGenre ? rawTitle : `${rawTitle} ${genre}`
  const maxCore = 60 - SUFFIX.length
  const truncatedCore = core.length <= maxCore ? core : core.slice(0, maxCore).trimEnd()
  const titleStr = truncatedCore + SUFFIX
  const title = { absolute: titleStr }
  const description = buildDescription(product)
  const ogImage     = product.seo?.ogImage ?? imageUrl(product.images[0], 800)

  return {
    title,
    description,
    keywords: product.seo?.keywords,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: titleStr,
      description,
      type: 'website',
      images: ogImage ? [{ url: ogImage, width: 800, height: 800, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: titleStr,
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil',    item: 'https://maisonduprestige.com/' },
      { '@type': 'ListItem', position: 2, name: 'Collection', item: 'https://maisonduprestige.com/collection' },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://maisonduprestige.com/product/${product.slug}` },
    ],
  }

  // Use || (not ??) so empty strings fall through to the next candidate
  const productDesc = product.longDescription || product.description || undefined
  const productImages = product.images.map((img) => imageUrl(img, 800)).filter(Boolean)

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: `https://maisonduprestige.com/product/${product.slug}`,
    sku: product.slug,
    ...(productDesc         && { description: productDesc }),
    ...(productImages.length > 0 && { image: productImages }),
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      'itemCondition': 'https://schema.org/NewCondition',
      'priceValidUntil': `${new Date().getFullYear()}-12-31`,
      // Omit price when 0 — the site shows "Prix sur demande" in that case
      ...(product.price > 0 && { price: product.price, priceCurrency: 'MAD' }),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Maison du Prestige' },
      url: `https://maisonduprestige.com/product/${product.slug}`,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'MAD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'MA' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 4, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'MA',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    ...(product.reviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  // Merge FAQ: Sanity content takes priority, then static map, then product.faq fallback
  const faq: ProductFaqItem[] =
    (product.faq?.length ? product.faq : null) ??
    PRODUCT_STATIC_FAQS[product.slug] ??
    []

  const faqSchema = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  } : null

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={productSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <ProductDetailClient
        product={product}
        related={related}
        reviews={reviews}
        whatsappNumber={whatsappNumber}
        sanityEnabled={isSanityConfigured()}
        faq={faq}
      />
    </>
  )
}
