import type { Metadata } from 'next'
import { products as localProducts } from '@/data/products'
import { sanityFetch } from '@/sanity/lib/fetch'
import { ALL_PRODUCTS_QUERY, ALL_COLLECTIONS_QUERY } from '@/sanity/lib/queries'
import { Product, CollectionData } from '@/types'
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
  const cat = category ?? 'all'
  return {
    title:      TITLES[cat] ?? 'Collection | Maison du Prestige',
    description: DESCS[cat] ?? 'Toute la collection de montres premium Maison du Prestige. Livraison gratuite partout au Maroc, paiement à la livraison.',
    alternates: { canonical: cat !== 'all' ? `/collection?category=${cat}` : '/collection' },
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
  const initialCategory = category ?? 'all'

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

  const activeCollection = initialCategory !== 'all'
    ? collections.find(c => c.value === initialCategory)
    : null

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: PAGE_TITLES[initialCategory] ?? activeCollection?.label ?? 'Notre Collection',
    ...(activeCollection?.description && { description: activeCollection.description }),
    url: initialCategory !== 'all'
      ? `https://www.maisonduprestige.com/collection?category=${initialCategory}`
      : 'https://www.maisonduprestige.com/collection',
  }

  return (
    <>
      <JsonLd data={collectionSchema} />
      <CollectionClient
        products={products}
        collections={collections}
        initialCategory={initialCategory}
      />
    </>
  )
}
