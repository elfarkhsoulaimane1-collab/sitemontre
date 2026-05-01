import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { WatermarkProvider } from '@/context/WatermarkContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Analytics from '@/components/Analytics'
import JsonLd from '@/components/JsonLd'
import ClientChatWidget from '@/components/ClientChatWidget'
import { sanityFetch } from '@/sanity/lib/fetch'
import { SITE_SETTINGS_QUERY, NAV_PAGES_QUERY } from '@/sanity/lib/queries'
import { SiteSettings, CmsPage } from '@/types'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const BASE_METADATA: Metadata = {
  metadataBase: new URL('https://www.maisonduprestige.com'),
  title: {
    default: 'Montres Maroc – Homme & Femme | Maison du Prestige',
    template: '%s | Maison du Prestige',
  },
  description:
    'Découvrez notre collection de montres premium inspirées du Maroc. Livraison gratuite partout au Maroc. Paiement à la livraison disponible.',
  authors: [{ name: 'Maison du Prestige' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: 'xuJiG0wzs2_nblXvBcWjgpV-phd8JJzPiX49cu9MZU0',
  },
  alternates: {
    canonical: '/',
  },
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<SiteSettings>(SITE_SETTINGS_QUERY)
  // Use Sanity ogImage if configured, otherwise fall back to local branded asset
  const ogImageUrl = settings?.ogImage ?? '/og-image.svg'
  const ogImageBlock = [
    {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: 'Collection de montres premium Maison du Prestige — Maroc',
    },
  ]
  return {
    ...BASE_METADATA,
    openGraph: {
      type: 'website',
      locale: 'fr_MA',
      siteName: 'Maison du Prestige',
      title: 'Maison du Prestige — Montres Premium au Maroc',
      description: 'Montres premium avec livraison gratuite partout au Maroc. Paiement à la livraison.',
      images: ogImageBlock,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Maison du Prestige — Montres Premium au Maroc',
      description: 'Livraison gratuite. Paiement à la livraison.',
      images: [ogImageUrl],
    },
  }
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Maison du Prestige',
  url: 'https://maisonduprestige.com',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['French', 'Arabic'],
  },
  areaServed: 'MA',
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Maison du Prestige',
  url: 'https://maisonduprestige.com',
}

// Fetches siteSettings and renders the full chrome (Navbar + Footer + Analytics).
// Lives in its own async component so RootLayout can suspend on it without
// blocking the page content from streaming to the client.
async function SiteShell({ children }: { children: React.ReactNode }) {
  const [settings, cmsPages] = await Promise.all([
    sanityFetch<SiteSettings>(SITE_SETTINGS_QUERY),
    sanityFetch<CmsPage[]>(NAV_PAGES_QUERY),
  ])
  const s = settings ?? undefined
  const pages = cmsPages ?? []
  return (
    <WatermarkProvider logoSrc={s?.logo ?? null}>
      <Analytics
        metaPixelId={s?.metaPixelId}
        tiktokPixelId={s?.tiktokPixelId}
        googleAnalyticsId={s?.googleAnalyticsId}
        googleAdsId={s?.googleAdsId}
      />
      <Navbar settings={s} cmsPages={pages} />
      <main>{children}</main>
      <Footer settings={s} cmsPages={pages} />
    </WatermarkProvider>
  )
}

// Shown while SiteShell's Sanity fetch is in-flight.
// Renders nav/footer chrome placeholders only — children are intentionally
// omitted to prevent duplicate heading and JSON-LD output in the streamed HTML.
// (React streaming emits both the fallback and the resolved shell into the
// raw HTML; including children in the fallback would make every H1, H2, H3
// and <script type="application/ld+json"> block appear twice to crawlers.)
function LayoutSkeleton() {
  return (
    <>
      <div className="h-16 bg-neutral-950 border-b border-neutral-800" aria-hidden="true" />
      <div className="min-h-[100dvh]" aria-hidden="true" />
      <div className="h-32 bg-neutral-950 border-t border-neutral-800" aria-hidden="true" />
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${inter.variable} overflow-x-hidden`}>
      <body className="overflow-x-hidden">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <CartProvider>
          <Suspense fallback={<LayoutSkeleton />}>
            <SiteShell>{children}</SiteShell>
          </Suspense>
          <ClientChatWidget />
        </CartProvider>
      </body>
    </html>
  )
}
