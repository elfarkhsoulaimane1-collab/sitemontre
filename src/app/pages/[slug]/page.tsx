import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { sanityFetch } from '@/sanity/lib/fetch'
import { PAGE_BY_SLUG_QUERY, PAGE_SLUGS_QUERY } from '@/sanity/lib/queries'
import { products } from '@/data/products'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

interface SanityPage {
  title: string
  slug: string
  content: unknown[]
  seo?: { title?: string; description?: string }
}

// Fallback static pages for when Sanity is not configured
const STATIC_PAGES: Record<string, { title: string; content: string }> = {
  'politique-livraison': {
    title: 'Politique de Livraison',
    content: `Nous livrons partout au Maroc. La livraison est gratuite pour toutes les commandes. Le délai de livraison est de 2 à 4 jours ouvrables après confirmation de votre commande. Notre équipe vous appellera pour confirmer votre commande dans les 2 heures suivant la passation.`,
  },
  'politique-retours': {
    title: 'Politique de Retours',
    content: `Vous disposez de 7 jours à compter de la réception de votre commande pour effectuer un retour. Le produit doit être dans son état d'origine, non utilisé et dans son emballage d'origine. Pour initier un retour, contactez-nous via WhatsApp.`,
  },
  'politique-confidentialite': {
    title: 'Politique de Confidentialité',
    content: `Nous collectons uniquement les informations nécessaires au traitement de votre commande (nom, téléphone, adresse). Ces informations ne sont jamais partagées avec des tiers sans votre consentement. Vous pouvez demander la suppression de vos données à tout moment.`,
  },
  contact: {
    title: 'Contactez-nous',
    content: `Vous pouvez nous joindre via WhatsApp au +212 6XX XX XX XX, disponible 7j/7 de 9h à 21h. Nous répondons à toutes les questions dans un délai de 2 heures.`,
  },
}

export async function generateStaticParams() {
  const sanityslugs = await sanityFetch<string[]>(PAGE_SLUGS_QUERY) ?? []
  const staticSlugs = Object.keys(STATIC_PAGES)
  const all = Array.from(new Set([...sanityslugs, ...staticSlugs]))
  return all.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await sanityFetch<SanityPage>(PAGE_BY_SLUG_QUERY, { slug })
  const fallback = STATIC_PAGES[slug]
  const title = page?.seo?.title ?? page?.title ?? fallback?.title ?? slug
  return {
    title,
    description: page?.seo?.description,
  }
}

// Portable Text components styled for dark luxury theme
const ptComponents = {
  block: {
    normal:  ({ children }: { children?: React.ReactNode }) => <p className="text-neutral-300 leading-relaxed mb-4">{children}</p>,
    h2:      ({ children }: { children?: React.ReactNode }) => <h2 className="font-serif text-2xl text-white font-bold mt-10 mb-4">{children}</h2>,
    h3:      ({ children }: { children?: React.ReactNode }) => <h3 className="font-serif text-xl text-white font-semibold mt-8 mb-3">{children}</h3>,
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-white font-semibold">{children}</strong>,
    em:     ({ children }: { children?: React.ReactNode }) => <em className="text-amber-400">{children}</em>,
    link:   ({ value, children }: { value?: { href: string }; children?: React.ReactNode }) =>
      <a href={value?.href} className="text-amber-400 hover:text-amber-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>,
  },
}

export default async function PageRoute({ params }: Props) {
  const { slug } = await params
  const page = await sanityFetch<SanityPage>(PAGE_BY_SLUG_QUERY, { slug })
  const fallback = STATIC_PAGES[slug]

  if (!page && !fallback) notFound()

  const title   = page?.title   ?? fallback!.title
  const hasCms  = !!(page?.content?.length)

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-10">
          <Link href="/" className="hover:text-amber-400 transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-neutral-300">{title}</span>
        </nav>

        <h1 className="font-serif text-4xl sm:text-5xl text-white font-bold mb-10">
          {title}
        </h1>

        <div className="prose-custom">
          {hasCms ? (
            <PortableText value={page!.content as Parameters<typeof PortableText>[0]['value']} components={ptComponents} />
          ) : (
            <p className="text-neutral-300 leading-relaxed">{fallback!.content}</p>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-800">
          <Link href="/" className="text-amber-400 text-xs uppercase tracking-widest hover:text-amber-300 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
