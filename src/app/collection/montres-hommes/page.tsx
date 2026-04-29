import type { Metadata } from 'next'
import Link from 'next/link'
import { products as localProducts } from '@/data/products'
import { sanityFetch } from '@/sanity/lib/fetch'
import { ALL_PRODUCTS_QUERY, COLLECTION_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import { Product } from '@/types'
import ProductCard from '@/components/ProductCard'
import JsonLd from '@/components/JsonLd'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Montres Homme Maroc',
  description: 'Découvrez notre collection de montres homme au Maroc. Montres premium pour homme avec livraison gratuite et paiement à la livraison partout au Maroc.',
  alternates: { canonical: '/collection/montres-hommes' },
  openGraph: {
    title: 'Montres Homme Maroc — Maison du Prestige',
    description: 'Collection de montres homme premium. Livraison gratuite, paiement à la livraison.',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil',    item: 'https://www.maisonduprestige.com/' },
    { '@type': 'ListItem', position: 2, name: 'Collection', item: 'https://www.maisonduprestige.com/collection' },
    { '@type': 'ListItem', position: 3, name: 'Montres Homme', item: 'https://www.maisonduprestige.com/collection/montres-hommes' },
  ],
}

export default async function MontresHommesPage() {
  const [sanityProducts, collection] = await Promise.all([
    sanityFetch<Product[]>(ALL_PRODUCTS_QUERY),
    sanityFetch<{ description?: string }>(COLLECTION_BY_SLUG_QUERY, { slug: 'montres-hommes' }),
  ])
  const products = sanityProducts ?? localProducts
  const description = collection?.description

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      {/* Header */}
      <section className="bg-neutral-950 py-20 px-4 text-center border-b border-neutral-800/60">
        <nav className="flex justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-8" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/collection" className="hover:text-gold transition-colors">Collection</Link>
          <span>/</span>
          <span className="text-gold">Homme</span>
        </nav>
        <p className="text-sm uppercase tracking-[0.2em] mb-4 text-gold/70">Notre sélection</p>
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mt-2">Montres Homme Maroc</h1>
        {description && (
          <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </section>

      {/* Product grid — pre-rendered for Googlebot */}
      <div className="bg-stone-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                priority={i < 4}
              />
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link href="/collection" className="btn-outline text-xs">
              Voir toute la collection
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
