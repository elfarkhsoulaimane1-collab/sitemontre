import type { Metadata } from 'next'
import { products as localProducts } from '@/data/products'
import { sanityFetch } from '@/sanity/lib/fetch'
import { ALL_PRODUCTS_QUERY, ALL_COLLECTIONS_QUERY } from '@/sanity/lib/queries'
import { Product, CollectionData } from '@/types'
import { imageUrl } from '@/sanity/lib/image'
import CollectionClient from './CollectionClient'
import JsonLd from '@/components/JsonLd'

interface Props {
  searchParams: Promise<{ category?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category } = await searchParams
  const TITLES: Record<string, string> = {
    'montres-hommes': 'Montres Homme au Maroc | Maison du Prestige',
    'montres-femmes': 'Montres Femme au Maroc | Maison du Prestige',
  }
  const DESCS: Record<string, string> = {
    'montres-hommes': 'Collection de montres homme premium au Maroc. Livraison gratuite, paiement à la livraison.',
    'montres-femmes': 'Collection de montres femme premium au Maroc. Livraison gratuite, paiement à la livraison.',
  }
  const cat = category ?? 'montres-femmes'
  return {
    title:       { absolute: TITLES[cat] ?? 'Collection | Maison du Prestige' },
    description: DESCS[cat]  ?? 'Toute la collection de montres premium Maison du Prestige. Livraison gratuite partout au Maroc, paiement à la livraison.',
    alternates: { canonical: `/collection?category=${cat}` },
  }
}

const FALLBACK_COLLECTIONS: CollectionData[] = [
  { value: 'luxury',     label: 'Luxe'        },
  { value: 'classic',    label: 'Classique'   },
  { value: 'sport',      label: 'Sport'       },
  { value: 'minimalist', label: 'Minimaliste' },
]

export default async function CollectionPage({ searchParams }: Props) {
  const { category } = await searchParams
  const initialCategory = category ?? 'montres-femmes'

  const [sanityProducts, sanityCollections] = await Promise.all([
    sanityFetch<Product[]>(ALL_PRODUCTS_QUERY),
    sanityFetch<CollectionData[]>(ALL_COLLECTIONS_QUERY),
  ])

  const products    = sanityProducts    ?? localProducts
  const collections = sanityCollections ?? FALLBACK_COLLECTIONS

  const PAGE_TITLES: Record<string, string> = {
    'montres-femmes': 'Montres Femme au Maroc',
    'montres-hommes': 'Montres Homme au Maroc',
  }

  const activeCollection = collections.find(c => c.value === initialCategory) ?? null

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLES[initialCategory] ?? activeCollection?.label ?? 'Notre Collection',
    ...(activeCollection?.description && { description: activeCollection.description }),
    url: `https://www.maisonduprestige.com/collection?category=${initialCategory}`,
  }

  const visibleProducts = products.filter(
    (p) => ((p as Product & { collectionSlug?: string }).collectionSlug ?? p.category) === initialCategory,
  )

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: PAGE_TITLES[initialCategory] ?? activeCollection?.label ?? 'Collection Montres',
    url: `https://www.maisonduprestige.com/collection?category=${initialCategory}`,
    numberOfItems: visibleProducts.length,
    itemListElement: visibleProducts.map((p, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://www.maisonduprestige.com/product/${p.slug}`,
      name: p.name,
      ...(p.images?.[0] && { image: imageUrl(p.images[0], 400) }),
      ...(p.price > 0 && {
        item: {
          '@type': 'Product',
          name: p.name,
          url: `https://www.maisonduprestige.com/product/${p.slug}`,
          ...(p.images?.[0] && { image: imageUrl(p.images[0], 400) }),
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'MAD',
            availability: p.inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        },
      }),
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Quelle montre choisir au Maroc ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Choisissez une montre selon votre style : classique, sport ou moderne. Nos collections offrent des modèles adaptés à toutes les occasions.' },
      },
      {
        '@type': 'Question',
        name: 'Les montres sont-elles originales ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Oui, toutes nos montres sont 100% originales et sélectionnées avec soin.' },
      },
      {
        '@type': 'Question',
        name: 'Quel est le délai de livraison ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Livraison rapide partout au Maroc en 24 à 48h.' },
      },
      {
        '@type': 'Question',
        name: 'Puis-je payer à la livraison ?',
        acceptedAnswer: { '@type': 'Answer', text: 'Oui, vous pouvez payer à la réception de votre commande en toute sécurité.' },
      },
    ],
  }

  return (
    <>
      <JsonLd data={collectionSchema} />
      <JsonLd data={faqSchema} />
      {visibleProducts.length > 0 && <JsonLd data={itemListSchema} />}
      <CollectionClient
        products={products}
        collections={collections}
        initialCategory={initialCategory}
      />
    </>
  )
}
