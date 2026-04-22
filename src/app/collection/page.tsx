import type { Metadata } from 'next'
import { Suspense } from 'react'
import { products as localProducts } from '@/data/products'
import { sanityFetch } from '@/sanity/lib/fetch'
import { ALL_PRODUCTS_QUERY, ALL_COLLECTIONS_QUERY } from '@/sanity/lib/queries'
import { Product, CollectionData } from '@/types'
import CollectionClient from './CollectionClient'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Collection',
  description: 'Toute la collection de montres premium Maison du Prestige. Livraison gratuite partout au Maroc, paiement à la livraison.',
  alternates: { canonical: '/collection' },
}

const FALLBACK_COLLECTIONS: CollectionData[] = [
  { value: 'luxury',     label: 'Luxe'        },
  { value: 'classic',    label: 'Classique'   },
  { value: 'sport',      label: 'Sport'       },
  { value: 'minimalist', label: 'Minimaliste' },
]

export default async function CollectionPage() {
  const [sanityProducts, sanityCollections] = await Promise.all([
    sanityFetch<Product[]>(ALL_PRODUCTS_QUERY),
    sanityFetch<CollectionData[]>(ALL_COLLECTIONS_QUERY),
  ])

  const products    = sanityProducts    ?? localProducts
  const collections = sanityCollections ?? FALLBACK_COLLECTIONS

  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-48 bg-neutral-800 animate-pulse mb-4" />
            <div className="h-12 w-72 bg-neutral-800 animate-pulse" />
          </div>
        </div>
      }
    >
      <CollectionClient products={products} collections={collections} />
    </Suspense>
  )
}
