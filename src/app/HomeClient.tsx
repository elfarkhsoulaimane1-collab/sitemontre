'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { imageUrl } from '@/sanity/lib/image'
import type { HomeData } from '@/types'

const HomeSections = dynamic(() => import('./HomeSections'), {
  ssr: false,
  loading: () => (
    <div className="bg-neutral-950" style={{ minHeight: '300vh' }} aria-hidden="true" />
  ),
})

/* ─── Safe image ──────────────────────────────────────────────────────────── */
function safeImg(v: unknown, w = 800, q = 75): string | null {
  if (!v) return null
  const s = typeof v === 'string' ? v : imageUrl(v, w, q)
  return s?.trim() || null
}

/* ─── Hero Heading (fallback if no server-rendered heading prop) ─────────── */
function HeroHeading({ title, accent }: { title: string; accent: string }) {
  return (
    <h1 className="mb-10 max-w-2xl">
      <span className="font-serif font-bold text-white uppercase tracking-[-0.04em] leading-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl block break-words">
        {title}
      </span>
      <span className="font-serif font-bold text-gradient uppercase tracking-[-0.04em] leading-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl block break-words">
        {accent}
      </span>
    </h1>
  )
}

/* ─── Placeholder ─────────────────────────────────────────────────────────── */
function Placeholder({ className }: { className?: string }) {
  return (
    <div className={`bg-neutral-900 flex items-center justify-center ${className ?? ''}`}>
      <svg className="w-8 h-8 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <circle cx="12" cy="12" r="7" /><path d="M12 9v3l2 2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* ─── Trust band icons ────────────────────────────────────────────────────── */
function IconTruck() {
  return (
    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  )
}
function IconCod() {
  return (
    <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const MARQUEE = [
  'MAISON DU PRESTIGE', 'LIVRAISON GRATUITE', 'AUTHENTICITÉ GARANTIE',
  'PAIEMENT À LA LIVRAISON', 'RETOURS 7 JOURS', 'COLLECTION MAROC 2025',
]

const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/* ════════════════════════════════════════════════════════════════════════════ */
export default function HomeClient({ data, heroHeading }: { data: HomeData; heroHeading?: React.ReactNode }) {
  const {
    heroTitle, heroTitleAccent, heroSubtitle, heroImage, heroVideo,
    heroCtaPrimary, heroCtaSecondary, heroTrustSignals,
  } = data

  const heroRef    = useRef<HTMLElement>(null)
  const bgRef      = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const trustBandRef = useRef<HTMLDivElement>(null)

  const heroSrc = safeImg(heroImage, 1920, 70)

  /* Parallax scroll — RAF-based, no framer-motion */
  useEffect(() => {
    const hero    = heroRef.current
    const bg      = bgRef.current
    const content = contentRef.current
    if (!hero || !bg || !content) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / hero.offsetHeight, 1)
        bg.style.transform      = `translateY(${progress * 20}%) scale(1.12)`
        content.style.transform = `translateY(${progress * 8}%)`
        content.style.opacity   = String(Math.max(0, 1 - progress / 0.45))
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Trust band — IntersectionObserver fade-in */
  useEffect(() => {
    const band = trustBandRef.current
    if (!band) return
    const items = Array.from(band.querySelectorAll<HTMLElement>('[data-trust-item]'))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(el => { el.style.opacity = '1' })
      return
    }

    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        items.forEach((el, i) => {
          el.style.animationDelay = `${i * 0.08}s`
          el.style.animation      = 'fadeIn 0.6s ease-out both'
        })
        io.disconnect()
      }
    }, { threshold: 0.1 })
    io.observe(band)
    return () => io.disconnect()
  }, [])

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          § 1  HERO
      ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex flex-col overflow-hidden bg-neutral-950">

        {/* Parallax background */}
        <div ref={bgRef} className="absolute inset-0 will-change-transform" style={{ transform: 'scale(1.12)' }}>
          {heroVideo
            ? <video src={heroVideo} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
            : heroSrc
              ? <Image src={heroSrc} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
              : <Placeholder className="absolute inset-0" />
          }
        </div>

        {/* Gradient stack */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/20 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,10,10,0.6) 0%,transparent 35%)' }} />

        {/* Film grain */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: GRAIN_URL, backgroundSize: '200px 200px' }} />

        {/* Left accent line */}
        <div
          className="absolute left-6 sm:left-10 lg:left-16 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent"
          style={{ animation: 'scaleYIn 1.6s cubic-bezier(0.16,1,0.3,1) 0.3s both', transformOrigin: 'top' }}
        />

        {/* Right editorial strip */}
        <div
          style={{ animation: 'fadeOpacity 1.2s ease-out 1.5s both' }}
          className="absolute top-0 right-0 bottom-0 w-[70px] border-l border-neutral-800/20 hidden xl:flex flex-col items-center justify-center gap-10 select-none"
          aria-hidden="true"
        >
          <p className="text-neutral-700 text-[8px] uppercase tracking-[0.6em] [writing-mode:vertical-rl]">Maroc — 2025</p>
          <div className="w-4 h-px bg-gold/30" />
          <p className="font-serif text-5xl font-bold text-neutral-800/40 [writing-mode:vertical-rl] leading-none">25</p>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-12 lg:px-20 xl:pr-28 pb-12 lg:pb-20 will-change-transform"
        >
          {/* Brand label */}
          <div
            style={{ animation: 'fadeInLeft 0.9s cubic-bezier(0.25,1,0.5,1) 0.1s both' }}
            className="flex items-center gap-5 mb-9"
          >
            <div
              style={{ animation: 'scaleXIn 1s cubic-bezier(0.16,1,0.3,1) 0.25s both', transformOrigin: 'left' }}
              className="h-px w-10 bg-gold flex-shrink-0"
            />
            <p className="text-gold text-[9px] uppercase tracking-[0.6em]">Maison du Prestige — Maroc</p>
          </div>

          {/* Headline — server-rendered via prop for LCP */}
          {heroHeading ?? <HeroHeading title={heroTitle} accent={heroTitleAccent} />}

          {/* Trust signals */}
          {heroTrustSignals.length > 0 && (
            <div
              style={{ animation: 'fadeOpacity 1s ease-out 0.75s both' }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8"
            >
              {heroTrustSignals.map((signal, i) => (
                <span key={i} className="flex items-center gap-2 text-neutral-300 text-[11px] tracking-wide">
                  {i > 0 && <span className="text-neutral-700 text-[7px]">◆</span>}
                  {signal}
                </span>
              ))}
            </div>
          )}

          {/* Bottom bar */}
          <div
            style={{ animation: 'fadeOpacity 1s ease-out 0.9s both' }}
            className="grid grid-cols-1 sm:grid-cols-3 sm:items-center gap-6 border-t border-neutral-800/60 pt-8"
          >
            <p className="text-neutral-400 text-[13px] leading-relaxed max-w-[300px]">{heroSubtitle}</p>

            <div className="flex sm:justify-center">
              <Link href="/collection"
                className="inline-flex items-center justify-center bg-gold text-black font-bold text-[11px] uppercase tracking-[0.3em] px-10 py-5 hover:bg-gold-light active:scale-[0.98] transition-all duration-300">
                {heroCtaPrimary}
              </Link>
            </div>

            <div className="flex sm:justify-end">
              <Link href="#showcase"
                className="group flex items-center gap-3 text-neutral-500 text-[10px] uppercase tracking-[0.35em] hover:text-white transition-colors duration-300">
                {heroCtaSecondary}
                <span className="text-gold inline-block animate-bounce-x">→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll pulse */}
        <div
          style={{ animation: 'fadeOpacity 1s ease-out 2s both' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center"
          aria-hidden="true"
        >
          <div className="w-px h-10 bg-gradient-to-b from-gold/50 to-transparent origin-top animate-scroll-pulse" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 2  GOLD MARQUEE
      ══════════════════════════════════════════════════════ */}
      <div className="bg-gold overflow-hidden py-3 select-none" aria-hidden="true">
        <div className="flex whitespace-nowrap will-change-transform animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-8 px-10">
              <span className="text-neutral-900/80 text-[8.5px] uppercase tracking-[0.5em] font-bold">{item}</span>
              <span className="text-neutral-900/25" style={{ fontSize: 4 }}>◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          § 2b  COD TRUST BAND
      ══════════════════════════════════════════════════════ */}
      <div className="bg-neutral-950 border-b border-neutral-800/60">
        <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">
          <div ref={trustBandRef} className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/60">
            {([
              { icon: <IconTruck />, title: 'Livraison Gratuite',      sub: 'Partout au Maroc en 2–4 jours ouvrables' },
              { icon: <IconCod />,   title: 'Paiement à la Livraison', sub: 'Payez en cash à la réception — aucun risque' },
              { icon: <IconWhatsApp />, title: 'Support WhatsApp',     sub: "Réponse en moins d'une heure, 7j/7" },
            ] as const).map(({ icon, title, sub }) => (
              <div
                key={title}
                data-trust-item=""
                className="flex items-center gap-5 px-6 sm:px-8 lg:px-12 py-7 opacity-0"
              >
                <div className="w-11 h-11 bg-gold/8 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-tight">{title}</p>
                  <p className="text-neutral-500 text-[12px] mt-0.5 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Below-fold sections — lazy-loaded after hero is visible */}
      <HomeSections data={data} />
    </>
  )
}
