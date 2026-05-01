import type { Metadata } from 'next'
import { products as localProducts } from '@/data/products'
import JsonLd from '@/components/JsonLd'
import { sanityFetch } from '@/sanity/lib/fetch'
import { HOME_PAGE_QUERY, ALL_POSTS_QUERY, HOMEPAGE_TESTIMONIALS_QUERY } from '@/sanity/lib/queries'
import { HomePageData, Product, PostCard, HomepageTestimonial } from '@/types'
import HomeClient from './HomeClient'

const FALLBACK_FEATURED_SLUGS = ['atlas-noir', 'sahara-dore', 'casablanca-chrono', 'berbere-limitee']

const FALLBACK_CATEGORIES = [
  { value: 'luxury',     label: 'Luxe',        subLabel: 'Prestige & raffinement',  image: 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=400&q=75' },
  { value: 'classic',    label: 'Classique',   subLabel: 'Intemporel & élégant',    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=400&q=75' },
  { value: 'sport',      label: 'Sport',       subLabel: 'Performance & robustesse', image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=400&q=75' },
  { value: 'minimalist', label: 'Minimaliste', subLabel: 'Épuré & moderne',         image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=75' },
]

const FALLBACK_TESTIMONIALS: HomepageTestimonial[] = [
  { _id: 'f1', name: 'Karim B.',   city: 'Casablanca', rating: 5, productName: 'Atlas Noir',        review: "J'ai commandé l'Atlas Noir et j'ai été bluffé par la qualité. Livraison en 2 jours, emballage premium, la montre est exactement comme sur les photos. Je recommande à 100%.", verified: true },
  { _id: 'f2', name: 'Fatima Z.',  city: 'Rabat',      rating: 5, productName: 'Sahara Doré',       review: "La Sahara Doré est absolument magnifique. J'ai reçu tellement de compliments. Le service client est aussi très réactif sur WhatsApp. Très satisfaite !", verified: true },
  { _id: 'f3', name: 'Youssef M.', city: 'Marrakech',  rating: 5, productName: 'Casablanca Chrono', review: "Achat de la Casablanca Chrono pour offrir. La présentation est digne d'une grande maison. Mon père était aux anges. Merci Maison du Prestige pour ce moment inoubliable.", verified: true },
]

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = { alternates: { canonical: '/' } }
  const data = await sanityFetch<HomePageData>(HOME_PAGE_QUERY)
  if (!data?.seo) return base
  return {
    ...base,
    ...(data.seo.title       && { title: data.seo.title }),
    ...(data.seo.description && { description: data.seo.description }),
    ...(data.seo.keywords?.length && { keywords: data.seo.keywords }),
    ...(data.seo.ogImage     && {
      openGraph: {
        images: [{ url: data.seo.ogImage, width: 1200, height: 630, alt: data.seo.title ?? 'Maison du Prestige' }],
      },
    }),
  }
}

export default async function HomePage() {
  const [cms, allPosts, cmsTestimonials] = await Promise.all([
    sanityFetch<HomePageData>(HOME_PAGE_QUERY),
    sanityFetch<PostCard[]>(ALL_POSTS_QUERY),
    sanityFetch<HomepageTestimonial[]>(HOMEPAGE_TESTIMONIALS_QUERY),
  ])
  const blogPosts       = (allPosts ?? []).slice(0, 3)
  const homepageReviews = cmsTestimonials?.length ? cmsTestimonials : FALLBACK_TESTIMONIALS

  const heroTitle        = cms?.heroTitle        ?? 'Montres de luxe originales'
  const heroTitleAccent  = cms?.heroTitleAccent  ?? 'au Maroc'
  const heroSubtitle     = cms?.heroSubtitle     ?? 'Montres premium inspirées des terres et cultures du Maroc. Chaque pièce est une déclaration.'
  const heroImage        = cms?.heroImage        ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
  const heroVideo        = typeof cms?.heroVideo === 'string'
    ? cms.heroVideo
    : cms?.heroVideo?.asset?.url
  const heroCtaPrimary   = cms?.heroCtaPrimary   ?? 'Acheter maintenant'
  const heroCtaSecondary = cms?.heroCtaSecondary ?? 'Voir la collection'
  const heroTrustSignals = cms?.heroTrustSignals ?? ['Livraison rapide partout au Maroc', 'Paiement à la livraison', 'Produits 100% originaux', 'Stock limité']

  const trustItems = cms?.trustItems ?? [
    { icon: '🚚', title: 'Livraison Gratuite',         subtitle: 'Partout au Maroc'   },
    { icon: '💵', title: 'Paiement à la Livraison',    subtitle: 'Payez en recevant'  },
    { icon: '🛡️', title: 'Authenticité Garantie',      subtitle: 'Ou remboursé'       },
    { icon: '↩',  title: 'Retours Faciles',            subtitle: 'Sous 7 jours'       },
  ]

  const featuredSectionSubtitle = cms?.featuredSectionSubtitle ?? 'Nos coups de cœur'
  const featuredSectionTitle    = cms?.featuredSectionTitle    ?? 'Bestsellers'

  const featuredProducts: Product[] = cms?.featuredProducts?.length
    ? cms.featuredProducts
    : FALLBACK_FEATURED_SLUGS.map((s) => localProducts.find((p) => p.slug === s)).filter(Boolean) as Product[]

  const categoriesSubtitle   = cms?.categoriesSubtitle ?? 'Trouvez votre style'
  const categoriesTitle      = cms?.categoriesTitle    ?? 'Par Univers'
  const featuredCollections  = cms?.featuredCollections?.length ? cms.featuredCollections : FALLBACK_CATEGORIES

  const brandSubtitle      = cms?.brandSubtitle      ?? 'Notre histoire'
  const brandTitle         = cms?.brandTitle         ?? "L'Horlogerie au service du"
  const brandTitleAccent   = cms?.brandTitleAccent   ?? 'Maroc Moderne'
  const brandText1         = cms?.brandText1         ?? "Maison du Prestige est née d'une passion pour l'horlogerie et d'un amour profond pour le Maroc. Chaque montre est pensée pour l'homme et la femme modernes qui portent leurs racines avec fierté."
  const brandText2         = cms?.brandText2         ?? "Nos collections s'inspirent des paysages, de l'architecture et des traditions du Royaume — de l'Atlas à l'Atlantique, du Sahara à la Méditerranée."
  const brandImage         = cms?.brandImage         ?? 'https://images.unsplash.com/photo-1585123388867-3bfe6dd4bdbf?auto=format&fit=crop&w=600&q=75'
  const brandYear          = cms?.brandYear          ?? '2019'
  const brandFoundedLabel  = cms?.brandFoundedLabel  ?? 'Fondé au Maroc'
  const brandStats         = cms?.brandStats         ?? [{ value: '8\u202f000+', label: 'Clients satisfaits' }, { value: '5 ans', label: "D'expertise" }, { value: '4.9/5', label: 'Note moyenne' }]

  const testimonialsSubtitle = cms?.testimonialsSubtitle ?? 'Ils nous font confiance'
  const testimonialsTitle    = cms?.testimonialsTitle    ?? 'Avis Clients'

  const ctaLabel    = cms?.ctaLabel    ?? 'Offre limitée'
  const ctaTitle    = cms?.ctaTitle    ?? "Jusqu'à"
  const ctaDiscount = cms?.ctaDiscount ?? '−25%'
  const ctaSubtitle = cms?.ctaSubtitle ?? 'Livraison offerte + paiement à la livraison. Ne manquez pas cette opportunité.'
  const ctaButton   = cms?.ctaButton   ?? "Profiter de l'offre maintenant"
  const ctaImage    = cms?.ctaImage    ?? 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1200&q=75'

  const newsletterSubtitle = cms?.newsletterSubtitle ?? 'Restez informé'
  const newsletterTitle    = cms?.newsletterTitle    ?? 'Accès VIP en Avant-Première'
  const newsletterText     = cms?.newsletterText     ?? 'Inscrivez-vous pour recevoir nos nouvelles collections et offres exclusives avant tout le monde.'
  const seoText            = cms?.seoText            ?? 'Maison du Prestige propose une sélection de montres homme et femme au Maroc, alliant élégance, qualité et prix accessible. Nos montres originales sont choisies pour offrir un style unique, avec livraison rapide partout au Maroc et paiement à la livraison.'

  const heroHeading = (
    <h1 className="mb-10 max-w-2xl">
      <span className="font-serif font-bold text-white uppercase tracking-[-0.04em] leading-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl block break-words">
        {heroTitle}
      </span>
      <span className="font-serif font-bold text-gradient uppercase tracking-[-0.04em] leading-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl block break-words">
        {heroTitleAccent}
      </span>
    </h1>
  )

  return (
    <>
      <HomeClient heroHeading={heroHeading} data={{
        heroTitle, heroTitleAccent, heroSubtitle, heroImage, heroVideo,
        heroCtaPrimary, heroCtaSecondary, heroTrustSignals,
        trustItems,
        featuredSectionSubtitle, featuredSectionTitle, featuredProducts,
        categoriesSubtitle, categoriesTitle, featuredCollections,
        brandSubtitle, brandTitle, brandTitleAccent, brandText1, brandText2,
        brandImage, brandYear, brandFoundedLabel, brandStats,
        testimonialsSubtitle, testimonialsTitle,
        homepageReviews,
        ctaLabel, ctaTitle, ctaDiscount, ctaSubtitle, ctaButton, ctaImage,
        newsletterSubtitle, newsletterTitle, newsletterText,
        blogPosts,
        seoText,
      }} />

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'Maison du Prestige',
        description: 'Montres premium inspirées du Maroc. Livraison gratuite, paiement à la livraison.',
        url: 'https://www.maisonduprestige.com',
        currenciesAccepted: 'MAD',
        paymentAccepted: 'Cash',
        areaServed: 'MA',
      }} />

      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Livrez-vous partout au Maroc ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, Maison du Prestige livre partout au Maroc. La livraison est gratuite pour toute commande supérieure à 500 MAD. Pour les commandes inférieures, des frais de 50 MAD s\'appliquent. Les délais sont de 2 à 4 jours ouvrables.',
            },
          },
          {
            '@type': 'Question',
            name: 'Puis-je payer à la livraison (COD) ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Oui, nous proposons uniquement le paiement à la livraison (Cash on Delivery). Vous payez en espèces à la réception de votre commande — aucun risque, aucune carte bancaire requise.',
            },
          },
          {
            '@type': 'Question',
            name: 'Les montres sont-elles authentiques et garanties ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Toutes nos montres sont 100 % authentiques et livrées avec leur garantie officielle. Nous ne vendons aucune contrefaçon. En cas de problème, vous bénéficiez de notre politique de retour sous 7 jours.',
            },
          },
          {
            '@type': 'Question',
            name: 'Comment puis-je contacter le service client ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Notre service client est disponible via WhatsApp, 7j/7. Nous répondons en français, en arabe et en darija. Vous pouvez également utiliser le chat en ligne sur notre site.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quelles marques de montres proposez-vous ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Maison du Prestige propose une sélection de montres de marques reconnues dont Guess, Michael Kors, et d\'autres grandes marques premium. Toutes les montres sont authentiques et disponibles avec livraison au Maroc.',
            },
          },
        ],
      }} />
    </>
  )
}
