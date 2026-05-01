import Link from 'next/link'
import { SiteSettings, NavLink, CmsPage } from '@/types'

interface Props {
  settings?: SiteSettings
  cmsPages?: CmsPage[]
}

const CORE_NAV: NavLink[] = [
  { href: '/',              label: 'Accueil'    },
  { href: '/collection',    label: 'Collection' },
  { href: '/blog',          label: 'Blog'       },
  { href: '/pages/about',   label: 'À propos'   },
  { href: '/pages/contact', label: 'Contact'    },
]

const DEFAULT_COMMITMENTS = [
  'Livraison gratuite nationwide',
  'Paiement à la livraison',
  'Retours sous 7 jours',
  'Authenticité garantie',
  'Service client 7j/7',
]

export default function Footer({ settings, cmsPages = [] }: Props) {
  const siteName    = settings?.siteName    ?? 'Maison du Prestige'
  const tagline     = settings?.siteDescription ?? 'Des montres premium inspirées du Maroc. Chaque pièce raconte une histoire. Chaque seconde compte.'
  const wa          = settings?.whatsappNumber ?? '212600000000'
  const pageLinks: NavLink[] = cmsPages.map(p => ({ href: `/pages/${p.slug}`, label: p.title }))
  const navLinks    = settings?.footerNavLinks?.length  ? settings.footerNavLinks  : [...CORE_NAV, ...pageLinks]
  const commitments = settings?.footerCommitments?.length ? settings.footerCommitments : DEFAULT_COMMITMENTS
  const copyright   = settings?.footerCopyright ?? `${siteName}. Tous droits réservés.`
  const ctaTagline  = settings?.footerTagline ?? 'Une question ? Contactez-nous.'
  const ctaSub      = settings?.footerCtaSubtitle ?? 'Réponse garantie sous 2 heures via WhatsApp.'

  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent("Bonjour Maison du Prestige, j'ai une question.")}`

  return (
    <footer className="bg-neutral-950 border-t border-neutral-900">
      {/* CTA strip */}
      <div className="bg-neutral-900 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-serif text-2xl text-white">{ctaTagline}</p>
            <p className="text-neutral-400 text-sm mt-1">{ctaSub}</p>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary whitespace-nowrap"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="font-serif text-2xl tracking-[0.3em] text-white"
            >
              {siteName}
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mt-4 max-w-xs">
              {tagline}
            </p>
            <div className="flex gap-4 mt-6">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"
                   className="text-xs uppercase tracking-widest text-neutral-300 hover:text-amber-400 transition-colors duration-300">
                  Instagram
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer"
                   className="text-xs uppercase tracking-widest text-neutral-300 hover:text-amber-400 transition-colors duration-300">
                  Facebook
                </a>
              )}
              {settings?.tiktokUrl && (
                <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer"
                   className="text-xs uppercase tracking-widest text-neutral-300 hover:text-amber-400 transition-colors duration-300">
                  TikTok
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Liens du pied de page">
            <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-300 mb-6">
              Navigation
            </h3>
            <ul className="space-y-3">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-neutral-400 hover:text-amber-400 transition-colors duration-300"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Commitments */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-300 mb-6">
              Nos Engagements
            </h3>
            <ul className="space-y-3">
              {commitments.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5" aria-hidden="true">✓</span>
                  <span className="text-sm text-neutral-400">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-400 text-xs">
            © {new Date().getFullYear()} {copyright}
          </p>
          <p className="text-neutral-400 text-xs">Fait avec passion au Maroc 🇲🇦</p>
        </div>
      </div>
    </footer>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
