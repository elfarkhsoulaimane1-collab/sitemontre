'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CartBadge from './CartBadge'
import { SiteSettings, NavLink, CmsPage } from '@/types'

interface Props {
  settings?: SiteSettings
  cmsPages?: CmsPage[]
}

const CORE_NAV: NavLink[] = [
  { href: '/',           label: 'Accueil'    },
  { href: '/collection', label: 'Collection' },
  { href: '/blog',       label: 'Blog'       },
]

export default function Navbar({ settings, cmsPages = [] }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const siteName     = settings?.siteName ?? 'Maison du Prestige'
  const announcement = settings?.announcementBar
    ?? 'Livraison gratuite\u00a0\u2022\u00a0Paiement à la livraison\u00a0\u2022\u00a0Retours sous 7 jours'
  const pageLinks: NavLink[] = cmsPages.map(p => ({ href: `/pages/${p.slug}`, label: p.title }))
  const navLinks     = settings?.navLinks?.length ? settings.navLinks : [...CORE_NAV, ...pageLinks]
  const phone        = settings?.phone ?? '+212 6XX XX XX XX'

  return (
    <>
      {/* Announcement bar */}
      {announcement && (
        <div className="bg-neutral-950 border-b border-neutral-800/60 py-2 px-4 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
          {announcement}
        </div>
      )}

      {/* Header */}
      <header className="bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-6">

            {/* Logo */}
            <Link
              href="/"
              aria-label={siteName}
              className="flex-shrink-0 font-serif text-sm tracking-[0.25em] text-white hover:text-gold transition-colors duration-300 whitespace-nowrap"
            >
              {siteName}
            </Link>

            {/* Desktop nav — shown at 1280px+ where all 8 links fit */}
            <nav
              className="hidden xl:flex items-center gap-5 2xl:gap-7"
              aria-label="Navigation principale"
            >
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-white transition-colors duration-300 whitespace-nowrap"
                >
                  {label}
                  <span className="absolute -bottom-px left-0 h-px w-0 bg-gold transition-[width] duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right: cart + hamburger */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href="/cart"
                aria-label="Panier"
                className="relative flex items-center text-neutral-400 hover:text-white transition-colors duration-300"
              >
                <CartIcon />
                <CartBadge />
              </Link>

              <button
                className="xl:hidden flex flex-col items-center justify-center gap-[5px] w-8 h-8"
                onClick={() => setOpen(v => !v)}
                aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={open}
              >
                <span className={`block h-px w-5 bg-white origin-center transition-all duration-300 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
                <span className={`block h-px w-5 bg-white transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
                <span className={`block h-px w-5 bg-white origin-center transition-all duration-300 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile / tablet overlay — below xl */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`xl:hidden fixed inset-0 z-50 bg-neutral-950 flex flex-col transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-neutral-800 flex-shrink-0">
          <Link href="/" onClick={() => setOpen(false)} className="font-serif text-sm tracking-[0.25em] text-white whitespace-nowrap">
            {siteName}
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 flex flex-col" aria-label="Navigation mobile">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between py-5 border-b border-neutral-800/50"
            >
              <span className="font-serif text-xl text-neutral-300 group-hover:text-white transition-colors duration-200">
                {label}
              </span>
              <svg
                className="w-4 h-4 text-neutral-700 group-hover:text-gold transition-colors duration-200 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ))}

          <div className="py-8">
            <Link
              href="/collection"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full bg-gold text-black font-black text-[11px] uppercase tracking-[0.25em] py-4 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
            >
              Voir la collection
            </Link>
          </div>
        </nav>

        <div className="flex-shrink-0 px-5 py-4 border-t border-neutral-800">
          <p className="text-neutral-600 text-[10px] uppercase tracking-[0.2em] text-center">
            {phone}&nbsp;·&nbsp;WhatsApp disponible
          </p>
        </div>
      </div>
    </>
  )
}

function CartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  )
}
