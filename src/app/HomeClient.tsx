'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import ProductCard from '@/components/ProductCard'
import ProductImageWatermark from '@/components/ProductImageWatermark'
const NewsletterForm = dynamic(() => import('@/components/NewsletterForm'), { ssr: false })
import { imageUrl } from '@/sanity/lib/image'
import type { Product, PostCard, HomepageTestimonial } from '@/types'

/* ─── Safe image ──────────────────────────────────────────────────────── */
function safeImg(v: unknown, w = 800): string | null {
  if (!v) return null
  const s = typeof v === 'string' ? v : imageUrl(v, w)
  return s?.trim() || null
}

/* ─── Placeholder ─────────────────────────────────────────────────────── */
function Placeholder({ className }: { className?: string }) {
  return (
    <div className={`bg-neutral-900 flex items-center justify-center ${className ?? ''}`}>
      <svg className="w-8 h-8 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <circle cx="12" cy="12" r="7" /><path d="M12 9v3l2 2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* ─── Easing curves ───────────────────────────────────────────────────── */
const EXPO = [0.16, 1, 0.3, 1] as const
const SOFT = [0.25, 1, 0.5, 1] as const

/* ─── Clip reveal — hero lines ───────────────────────────────────────── */
function Clip({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: reduced ? 0 : '108%' }}
        animate={{ y: 0 }}
        transition={{ duration: 1.2, delay, ease: EXPO }}
      >
        {children}
      </motion.div>
    </div>
  )
}

/* ─── Fade + rise (sections) ─────────────────────────────────────────── */
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.85, delay, ease: SOFT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Horizontal slide ───────────────────────────────────────────────── */
function Slide({ children, delay = 0, dir = 'left' as 'left' | 'right', className }: {
  children: React.ReactNode; delay?: number; dir?: 'left' | 'right'; className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : (dir === 'left' ? -28 : 28) }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.9, delay, ease: SOFT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Stagger grid ────────────────────────────────────────────────────── */
function Grid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{ h: {}, s: { transition: { staggerChildren: 0.08 } } }}
      initial="h" whileInView="s" viewport={{ once: true, margin: '-48px' }}
      className={className}
    >{children}</motion.div>
  )
}
function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      variants={{ h: { opacity: 0, y: reduced ? 0 : 28 }, s: { opacity: 1, y: 0, transition: { duration: 0.7, ease: SOFT } } }}
      className={className}
    >{children}</motion.div>
  )
}

/* ─── Gold rule ───────────────────────────────────────────────────────── */
function GoldRule({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, ease: EXPO }}
      style={{ originX: 0 }}
      className={`h-px bg-gold ${className ?? ''}`}
    />
  )
}

/* ─── Stars ───────────────────────────────────────────────────────────── */
function Stars({ rating, className = 'w-3.5 h-3.5' }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`${className} ${i < rating ? 'text-gold' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

/* ─── Trust band icons ────────────────────────────────────────────────── */
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

/* ─── Editorial overlay product card ─────────────────────────────────── */
function OverlayCard({
  product, sizes = '60vw', aspect = 'aspect-[2/3]', index,
}: { product: Product; sizes?: string; aspect?: string; index?: number }) {
  const src = safeImg(product.images?.[0], 1000)
  const num = index !== undefined ? String(index + 1).padStart(2, '0') : null
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  return (
    <Link href={`/product/${product.slug}`} className={`group relative block overflow-hidden bg-neutral-950 ${aspect}`}>
      {src
        ? <Image src={src} alt={product.name} fill unoptimized sizes={sizes}
            className="object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]" />
        : <Placeholder className="absolute inset-0" />
      }

      {/* Gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/45 via-transparent to-transparent" />

      <ProductImageWatermark />

      {/* Badges */}
      {product.badge && (
        <span className="absolute top-2 left-2 sm:top-5 sm:left-5 badge-gold z-10 text-[8px] sm:text-[10px]">{product.badge}</span>
      )}
      {discount && !product.badge && (
        <span className="absolute top-2 left-2 sm:top-5 sm:left-5 badge badge-red z-10 text-[8px] sm:text-[10px]">−{discount}%</span>
      )}

      {/* Index */}
      {num && (
        <span className="absolute top-5 right-6 font-serif text-[10px] text-neutral-600 tracking-[0.3em] z-10 group-hover:text-gold/60 transition-colors duration-700">
          {num}
        </span>
      )}

      {/* Bottom panel */}
      <div className="absolute bottom-0 inset-x-0 p-3 sm:p-7 md:p-9 z-10">
        <div className="overflow-hidden h-px mb-2 sm:mb-6">
          <div className="h-full bg-gold origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
        </div>

        <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.5em] text-gold/75 mb-1 sm:mb-2.5 group-hover:text-gold transition-colors duration-500">
          {product.brand}
        </p>
        <h3 className="font-serif text-sm sm:text-2xl lg:text-[clamp(26px,2.6vw,42px)] text-white font-bold leading-tight sm:leading-[1.05] mb-2 sm:mb-5 line-clamp-3 sm:line-clamp-none">
          {product.name}
        </h3>

        <div className="flex items-end justify-between gap-2 sm:gap-4">
          <div>
            <p className="text-white font-bold text-base sm:text-2xl leading-none">
              {product.price.toLocaleString('fr-MA')}
              <span className="text-gold text-xs sm:text-sm font-semibold ml-1 sm:ml-2">MAD</span>
            </p>
            {product.originalPrice && (
              <p className="text-neutral-500 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-through">
                {product.originalPrice.toLocaleString('fr-MA')} MAD
              </p>
            )}
          </div>
          <span className="hidden sm:flex text-[9px] uppercase tracking-[0.4em] text-neutral-600 group-hover:text-gold transition-colors duration-500 items-center gap-2 flex-shrink-0">
            Voir
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>→</motion.span>
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Blog post cards ────────────────────────────────────────────────── */
const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
function formatPostDate(iso: string) {
  const [y, m, d] = (iso ?? '').slice(0, 10).split('-')
  return `${d} ${FR_MONTHS[parseInt(m, 10) - 1] ?? ''} ${y}`
}
function BlogHeroCard({ post, sizes, minH, tall }: {
  post: PostCard; sizes: string; minH: string; tall?: boolean
}) {
  const img = safeImg(post.mainImage, 1200)
  const date = formatPostDate(post.publishedAt)
  return (
    <Link href={`/blog/${post.slug}`}
      className={`group relative block overflow-hidden bg-neutral-900 h-[360px] sm:h-[500px] ${tall ? 'lg:h-full' : ''} ${minH}`}>
      {img
        ? <Image src={img} alt={post.mainImage?.alt ?? post.title} fill unoptimized sizes={sizes}
            className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]" />
        : <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
            <span className="font-serif text-5xl text-gold/20">M</span>
          </div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-neutral-950/50" />
      <div className="absolute bottom-0 inset-x-0 p-8 sm:p-12">
        <p className="text-[9px] uppercase tracking-[0.5em] text-gold mb-3">{date}</p>
        <h3 className="font-serif text-3xl sm:text-4xl text-white font-bold leading-tight mb-4">{post.title}</h3>
        {post.excerpt && (
          <p className="text-neutral-400 text-[13px] leading-relaxed max-w-md line-clamp-2 mb-7">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-4 pt-6 border-t border-neutral-800/60">
          <div className="h-px w-0 bg-gold group-hover:w-8 transition-[width] duration-700 ease-out" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-gold">Lire l&apos;article</span>
        </div>
      </div>
    </Link>
  )
}

function BlogSmallCard({ post }: { post: PostCard }) {
  const img = safeImg(post.mainImage, 700)
  const date = formatPostDate(post.publishedAt)
  return (
    <Link href={`/blog/${post.slug}`}
      className="group relative block h-full min-h-[255px] overflow-hidden bg-neutral-900">
      {img
        ? <Image src={img} alt={post.mainImage?.alt ?? post.title} fill unoptimized sizes="(max-width:1023px) 100vw, 33vw"
            className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.05]" />
        : <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
            <span className="font-serif text-4xl text-gold/20">M</span>
          </div>
      }
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/30" />
      <div className="absolute inset-0 p-7 sm:p-9 flex flex-col justify-end">
        <p className="text-[9px] uppercase tracking-[0.45em] text-gold mb-2">{date}</p>
        <h3 className="font-serif text-xl text-white font-bold leading-snug mb-3">{post.title}</h3>
        <div className="flex items-center gap-3">
          <div className="h-px w-0 bg-gold group-hover:w-5 transition-[width] duration-500 ease-out" />
          <span className="text-[9px] uppercase tracking-[0.4em] text-neutral-500 group-hover:text-gold transition-colors duration-300">Lire</span>
        </div>
      </div>
    </Link>
  )
}

/* ─── Types ───────────────────────────────────────────────────────────── */
interface CategoryItem  { value: string; label: string; subLabel?: string; image?: string }
interface TrustItem     { icon: string; title: string; subtitle: string }
interface Testimonial   { name: string; city: string; rating: number; product: string; text: string; verified?: boolean; avatar?: string }
interface StatItem      { value: string; label: string }

export interface HomeData {
  heroTitle: string; heroTitleAccent: string; heroSubtitle: string; heroImage: string; heroVideo?: string
  heroCtaPrimary: string; heroCtaSecondary: string; heroTrustSignals: string[]
  trustItems: TrustItem[]
  featuredSectionSubtitle: string; featuredSectionTitle: string; featuredProducts: Product[]
  categoriesSubtitle: string; categoriesTitle: string; featuredCollections: CategoryItem[]
  brandSubtitle: string; brandTitle: string; brandTitleAccent: string
  brandText1: string; brandText2: string; brandImage: string
  brandYear: string; brandFoundedLabel: string; brandStats: StatItem[]
  testimonialsSubtitle: string; testimonialsTitle: string
  homepageReviews: HomepageTestimonial[]
  ctaLabel: string; ctaTitle: string; ctaDiscount: string
  ctaSubtitle: string; ctaButton: string; ctaImage: string
  newsletterSubtitle: string; newsletterTitle: string; newsletterText: string
  blogPosts: PostCard[]
}

/* ─── Constants ───────────────────────────────────────────────────────── */
const MARQUEE = [
  'MAISON DU PRESTIGE', 'LIVRAISON GRATUITE', 'AUTHENTICITÉ GARANTIE',
  'PAIEMENT À LA LIVRAISON', 'RETOURS 7 JOURS', 'COLLECTION MAROC 2025',
]


const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/* ════════════════════════════════════════════════════════════════════════ */
export default function HomeClient({ data }: { data: HomeData }) {
  const {
    heroTitle, heroTitleAccent, heroSubtitle, heroImage, heroVideo,
    heroCtaPrimary, heroCtaSecondary, heroTrustSignals,
    featuredSectionSubtitle, featuredSectionTitle, featuredProducts,
    categoriesSubtitle, categoriesTitle, featuredCollections,
    testimonialsSubtitle, testimonialsTitle, homepageReviews,
    ctaLabel, ctaTitle, ctaDiscount, ctaSubtitle, ctaButton, ctaImage,
    newsletterSubtitle, newsletterTitle, newsletterText,
    blogPosts,
  } = data

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY      = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const textY    = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const textFade = useTransform(scrollYProgress, [0, 0.45], [1, 0])

  const heroSrc = safeImg(heroImage, 1920)
  const ctaSrc  = safeImg(ctaImage,  1800)

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          § 1  HERO
      ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex flex-col overflow-hidden bg-neutral-950">

        {/* Parallax background */}
        <motion.div style={{ y: bgY }} className="absolute inset-0 scale-[1.12] will-change-transform">
          {heroVideo
            ? <video src={heroVideo} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
            : heroSrc
              ? <Image src={heroSrc} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
              : <Placeholder className="absolute inset-0" />
          }
        </motion.div>

        {/* Gradient stack */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/20 to-transparent" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(10,10,10,0.6) 0%,transparent 35%)' }} />

        {/* Film grain */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: GRAIN_URL, backgroundSize: '200px 200px' }} />

        {/* Left accent line */}
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ duration: 1.6, delay: 0.3, ease: EXPO }}
          style={{ originY: 0 }}
          className="absolute left-6 sm:left-10 lg:left-16 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/25 to-transparent"
        />

        {/* Right editorial strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="absolute top-0 right-0 bottom-0 w-[70px] border-l border-neutral-800/20 hidden xl:flex flex-col items-center justify-center gap-10 select-none"
          aria-hidden="true"
        >
          <p className="text-neutral-700 text-[8px] uppercase tracking-[0.6em] [writing-mode:vertical-rl]">Maroc — 2025</p>
          <div className="w-4 h-px bg-gold/30" />
          <p className="font-serif text-5xl font-bold text-neutral-800/40 [writing-mode:vertical-rl] leading-none">25</p>
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ y: textY, opacity: textFade }}
          className="relative z-10 flex flex-col justify-end h-full px-6 sm:px-12 lg:px-20 xl:pr-28 pb-12 lg:pb-20 will-change-transform"
        >
          {/* Brand label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: SOFT }}
            className="flex items-center gap-5 mb-9"
          >
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.25, ease: EXPO }} style={{ originX: 0 }}
              className="h-px w-10 bg-gold flex-shrink-0" />
            <p className="text-gold text-[9px] uppercase tracking-[0.6em]">Maison du Prestige — Maroc</p>
          </motion.div>

          {/* Headline */}
          <div className="mb-10">
            <Clip delay={0.2}>
              <span className="font-serif font-bold text-white uppercase tracking-[-0.04em] leading-[0.9] lg:leading-[0.87] block"
                style={{ fontSize: 'clamp(64px, 14vw, 160px)' }}>
                {heroTitle}
              </span>
            </Clip>
            <Clip delay={0.38}>
              <span className="font-serif font-bold text-gradient uppercase tracking-[-0.04em] leading-[0.9] lg:leading-[0.87] block"
                style={{ fontSize: 'clamp(64px, 14vw, 160px)' }}>
                {heroTitleAccent}
              </span>
            </Clip>
          </div>

          {/* Trust signals */}
          {heroTrustSignals.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.75 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8"
            >
              {heroTrustSignals.map((signal, i) => (
                <span key={i} className="flex items-center gap-2 text-neutral-300 text-[11px] tracking-wide">
                  {i > 0 && <span className="text-neutral-700 text-[7px]">◆</span>}
                  {signal}
                </span>
              ))}
            </motion.div>
          )}

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
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
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="text-gold">→</motion.span>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll pulse */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center"
          aria-hidden="true"
        >
          <motion.div
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.6 }}
            className="w-px h-10 bg-gradient-to-b from-gold/50 to-transparent origin-top"
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 2  GOLD MARQUEE
      ══════════════════════════════════════════════════════ */}
      <div className="bg-gold overflow-hidden py-3 select-none" aria-hidden="true">
        <motion.div
          animate={{ x: [0, '-50%'] }}
          transition={{ duration: 44, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap will-change-transform"
        >
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-8 px-10">
              <span className="text-neutral-900/80 text-[8.5px] uppercase tracking-[0.5em] font-bold">{item}</span>
              <span className="text-neutral-900/25" style={{ fontSize: 4 }}>◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════
          § 2b  COD TRUST BAND
      ══════════════════════════════════════════════════════ */}
      <div className="bg-neutral-950 border-b border-neutral-800/60">
        <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-800/60">
            {([
              {
                icon: <IconTruck />,
                title: 'Livraison Gratuite',
                sub: 'Partout au Maroc en 2–4 jours ouvrables',
              },
              {
                icon: <IconCod />,
                title: 'Paiement à la Livraison',
                sub: 'Payez en cash à la réception — aucun risque',
              },
              {
                icon: <IconWhatsApp />,
                title: 'Support WhatsApp',
                sub: "Réponse en moins d'une heure, 7j/7",
              },
            ] as const).map(({ icon, title, sub }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: SOFT }}
                className="flex items-center gap-5 px-6 sm:px-8 lg:px-12 py-7"
              >
                <div className="w-11 h-11 bg-gold/8 border border-gold/20 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-tight">{title}</p>
                  <p className="text-neutral-500 text-[12px] mt-0.5 leading-snug">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          § 3  COLLECTION UNIVERSES
      ══════════════════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-28 lg:py-40 border-t border-neutral-800/40" aria-label="Collections">
        <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">

          <div className="flex items-end justify-between mb-14 gap-8">
            <Reveal>
              <p className="text-[9px] uppercase tracking-[0.55em] text-gold/70 mb-3">{categoriesSubtitle}</p>
              <h2 className="font-serif text-[clamp(36px,5.5vw,72px)] font-bold text-white leading-none tracking-[-0.025em]">
                {categoriesTitle}
              </h2>
            </Reveal>
            <GoldRule className="flex-1 mb-[6px] hidden sm:block" />
          </div>

          <Grid className="grid grid-cols-2 md:grid-cols-4 gap-[3px]">
            {featuredCollections.map(({ value, label, subLabel, image }, idx) => {
              const catSrc = safeImg(image, 700)
              const num = String(idx + 1).padStart(2, '0')
              return (
                <Cell key={value}>
                  <Link
                    href={`/collection?category=${value}`}
                    className="group relative flex flex-col aspect-[2/3] lg:aspect-[1/1.6] overflow-hidden bg-neutral-900"
                    aria-label={`Collection ${label}`}
                  >
                    {catSrc
                      ? <Image src={catSrc} alt={label} fill unoptimized
                          className="object-cover transition-transform duration-[1.8s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07]"
                          sizes="(max-width:639px) 50vw, 25vw" />
                      : <Placeholder className="absolute inset-0" />
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/20 to-neutral-950/45 group-hover:from-neutral-950/80 transition-all duration-700" />

                    <span className="absolute top-5 right-5 font-serif text-[9px] text-neutral-600/60 tracking-[0.3em] group-hover:text-gold/50 transition-colors duration-700">
                      {num}
                    </span>

                    <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7">
                      <div className="h-px bg-gold w-0 group-hover:w-full transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] mb-4" />
                      <p className="font-serif text-xl sm:text-2xl text-white font-bold leading-tight">
                        {label}
                      </p>
                      <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-2">
                        {subLabel}
                      </p>
                    </div>
                  </Link>
                </Cell>
              )
            })}
          </Grid>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 5  EDITORIAL SHOWCASE
      ══════════════════════════════════════════════════════ */}
      <section id="showcase" className="bg-white pt-24 pb-32 lg:pt-32 lg:pb-44">
        <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">

          <div className="flex items-end justify-between mb-14 gap-6">
            <Slide>
              <p className="text-[9px] uppercase tracking-[0.55em] text-neutral-400 mb-3">{featuredSectionSubtitle}</p>
              <h2 className="font-serif text-[clamp(36px,5.5vw,72px)] font-bold text-neutral-900 leading-none tracking-[-0.025em]">
                {featuredSectionTitle}
              </h2>
            </Slide>
            <Slide dir="right" className="flex-shrink-0 pb-2">
              <Link href="/collection"
                className="group flex items-center gap-3 text-neutral-400 text-[9px] uppercase tracking-[0.45em] hover:text-neutral-900 transition-colors duration-300">
                Tout voir
                <span className="block w-6 h-px bg-stone-300 group-hover:bg-neutral-900 group-hover:w-12 transition-all duration-500 ease-out" />
              </Link>
            </Slide>
          </div>

          {featuredProducts.length >= 4 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-[3px] mb-[3px]">
                <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1, ease: EXPO }}
                  className="lg:col-span-3">
                  <OverlayCard product={featuredProducts[0]} aspect="aspect-[4/5] lg:aspect-auto lg:h-[640px]"
                    sizes="(max-width:1023px) 100vw, 60vw" index={0} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1, delay: 0.12, ease: EXPO }}
                  className="lg:col-span-2">
                  <OverlayCard product={featuredProducts[1]} aspect="aspect-[4/5] lg:aspect-auto lg:h-[640px]"
                    sizes="(max-width:1023px) 100vw, 40vw" index={1} />
                </motion.div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-[3px]">
                <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1, ease: EXPO }}
                  className="lg:col-span-2">
                  <OverlayCard product={featuredProducts[2]} aspect="aspect-[4/5] lg:aspect-auto lg:h-[540px]"
                    sizes="(max-width:1023px) 100vw, 40vw" index={2} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1, delay: 0.12, ease: EXPO }}
                  className="lg:col-span-3">
                  <OverlayCard product={featuredProducts[3]} aspect="aspect-[4/5] lg:aspect-auto lg:h-[540px]"
                    sizes="(max-width:1023px) 100vw, 60vw" index={3} />
                </motion.div>
              </div>
            </>
          ) : (
            <Grid className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <Cell key={p.id}><ProductCard product={p} /></Cell>
              ))}
            </Grid>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 6  BLOG — real Sanity posts
      ══════════════════════════════════════════════════════ */}
      {blogPosts.length > 0 && (
        <section className="bg-stone-50 py-28 lg:py-40 border-t border-stone-200/60" aria-label="Articles et conseils">
          <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">

            <div className="flex items-end justify-between mb-14 gap-8">
              <Reveal>
                <p className="text-[9px] uppercase tracking-[0.55em] text-neutral-400 mb-3">Journal</p>
                <h2 className="font-serif text-[clamp(36px,5.5vw,72px)] font-bold text-neutral-900 leading-none tracking-[-0.025em]">
                  Articles &amp; Conseils
                </h2>
              </Reveal>
              <GoldRule className="flex-1 mb-[6px] hidden sm:block" />
            </div>

            {blogPosts.length === 1 ? (
              /* Single post — full-width hero card */
              <motion.div
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-48px' }} transition={{ duration: 0.9, ease: SOFT }}>
                <BlogHeroCard post={blogPosts[0]} sizes="100vw" minH="min-h-[420px] sm:min-h-[560px]" />
              </motion.div>
            ) : (
              /* 2–3 posts — editorial asymmetric grid */
              <div className="grid lg:grid-cols-3 gap-[3px]">
                <motion.div className="lg:col-span-2"
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-48px' }} transition={{ duration: 0.9, ease: SOFT }}>
                  <BlogHeroCard post={blogPosts[0]} sizes="(max-width:1023px) 100vw, 67vw" minH="min-h-[520px]" tall />
                </motion.div>

                <div className="flex flex-col gap-[3px]">
                  {blogPosts.slice(1, 3).map((post, i) => (
                    <motion.div key={post._id} className="flex-1"
                      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-48px' }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: SOFT }}>
                      <BlogSmallCard post={post} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <Reveal delay={0.15} className="flex justify-center mt-14">
              <Link href="/blog"
                className="group inline-flex items-center gap-5 border border-stone-300 text-neutral-500 text-[9px] uppercase tracking-[0.45em] px-10 py-4 hover:border-neutral-900 hover:text-neutral-900 transition-all duration-300">
                Voir tous les articles
                <span className="block w-4 h-px bg-stone-300 group-hover:bg-neutral-900 group-hover:w-8 transition-all duration-500" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          § 7  TESTIMONIALS
      ══════════════════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-28 lg:py-40 border-t border-neutral-800/40" aria-label="Avis clients">
        <div className="max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16">

          <div className="flex items-end justify-between mb-14 gap-8">
            <Reveal>
              <p className="text-[9px] uppercase tracking-[0.55em] text-gold/70 mb-3">{testimonialsSubtitle}</p>
              <h2 className="font-serif text-[clamp(36px,5.5vw,72px)] font-bold text-white leading-none tracking-[-0.025em]">
                {testimonialsTitle}
              </h2>
            </Reveal>
            <GoldRule className="flex-1 mb-[6px] hidden sm:block" />
          </div>

          {homepageReviews.length >= 3 ? (
            <div className="grid lg:grid-cols-3 gap-[3px]">
              <motion.article
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.85, ease: SOFT }}
                className="lg:col-span-2 bg-neutral-900 border border-neutral-800 p-10 sm:p-14 lg:p-16 flex flex-col justify-between"
              >
                <div>
                  <p className="font-serif text-[120px] text-gold/12 leading-none select-none -mb-10 -ml-3">&ldquo;</p>
                  <Stars rating={homepageReviews[0].rating} className="w-4 h-4" />
                  <blockquote className="font-serif text-2xl sm:text-3xl text-white leading-[1.45] mt-6">
                    &ldquo;{homepageReviews[0].review}&rdquo;
                  </blockquote>
                </div>
                <footer className="flex items-center gap-5 mt-12 pt-8 border-t border-neutral-800">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gold flex items-center justify-center flex-shrink-0">
                    {homepageReviews[0].avatar
                      ? <img src={homepageReviews[0].avatar} alt={homepageReviews[0].name} className="w-full h-full object-cover" />
                      : <span className="font-serif text-black font-bold text-lg">{homepageReviews[0].name[0]}</span>
                    }
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{homepageReviews[0].name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5 tracking-wide">
                      {homepageReviews[0].city}{homepageReviews[0].productName ? ` · ${homepageReviews[0].productName}` : ''}
                    </p>
                  </div>
                  {homepageReviews[0].verified && (
                    <span className="ml-auto text-[9px] text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 px-2.5 py-1 uppercase tracking-widest flex-shrink-0">
                      Vérifié
                    </span>
                  )}
                </footer>
              </motion.article>

              <div className="flex flex-col gap-[3px]">
                {homepageReviews.slice(1, 3).map((t, i) => (
                  <motion.article key={t._id}
                    initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.85, delay: 0.1 + i * 0.1, ease: SOFT }}
                    className="bg-neutral-900 border border-neutral-800 p-8 sm:p-10 flex flex-col justify-between flex-1">
                    <div>
                      <Stars rating={t.rating} className="w-3.5 h-3.5" />
                      <blockquote className="text-neutral-400 text-[14px] leading-relaxed mt-5">
                        &ldquo;{t.review}&rdquo;
                      </blockquote>
                    </div>
                    <footer className="flex items-center gap-3 mt-7 pt-5 border-t border-neutral-800">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        {t.avatar
                          ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                          : <span className="font-serif text-gold text-sm font-bold">{t.name[0]}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{t.name}</p>
                        <p className="text-neutral-500 text-xs">{t.city}{t.productName ? ` · ${t.productName}` : ''}</p>
                      </div>
                      {t.verified && (
                        <span className="text-[9px] text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 px-2 py-0.5 uppercase tracking-widest flex-shrink-0">
                          Vérifié
                        </span>
                      )}
                    </footer>
                  </motion.article>
                ))}
              </div>
            </div>
          ) : (
            <Grid className="grid md:grid-cols-3 gap-[3px]">
              {homepageReviews.map((t) => (
                <Cell key={t._id}>
                  <article className="bg-neutral-900 border border-neutral-800 p-8">
                    <Stars rating={t.rating} className="w-3.5 h-3.5" />
                    <blockquote className="text-neutral-400 text-sm leading-relaxed mt-5 mb-6">&ldquo;{t.review}&rdquo;</blockquote>
                    <p className="font-semibold text-white text-sm">{t.name} <span className="text-neutral-500 font-normal">· {t.city}</span></p>
                  </article>
                </Cell>
              ))}
            </Grid>
          )}

          {/* Social proof bar */}
          <Reveal delay={0.2} className="mt-10 border-t border-neutral-800/60 pt-10">
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
              {[
                { value: '8 000+', label: 'Clients satisfaits' },
                { value: '4.9 / 5', label: 'Note moyenne' },
                { value: '5 ans',   label: "D'expertise" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="font-serif text-3xl text-white font-bold leading-none">{value}</p>
                  <p className="text-neutral-600 text-[10px] uppercase tracking-[0.3em] mt-2">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 8  CTA — cinematic full-bleed
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-neutral-950 min-h-[700px] flex items-center" aria-label="Offre spéciale">
        {ctaSrc
          ? <Image src={ctaSrc} alt="" fill unoptimized className="object-cover opacity-25" />
          : <Placeholder className="absolute inset-0" />
        }
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/55 to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: GRAIN_URL, backgroundSize: '200px 200px' }} />

        {/* Discount watermark — visible on dark bg */}
        {ctaDiscount && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center px-8 lg:px-16 pointer-events-none select-none" aria-hidden="true">
            <p className="font-serif font-bold text-white/[0.06] leading-none tracking-[-0.06em]"
              style={{ fontSize: 'clamp(120px, 22vw, 300px)' }}>
              {ctaDiscount}
            </p>
          </div>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 py-28 lg:py-40">
          <Reveal>
            <div className="flex items-center gap-5 mb-7">
              <div className="h-px w-8 bg-gold" />
              <p className="text-[9px] uppercase tracking-[0.6em] text-gold">{ctaLabel}</p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-serif font-bold text-white leading-[0.9] mb-7 tracking-[-0.03em]">
              <span className="block text-2xl sm:text-3xl text-neutral-400 font-normal mb-3 tracking-[-0.01em]">{ctaTitle}</span>
              <span className="block text-gradient" style={{ fontSize: 'clamp(80px,14vw,160px)' }}>{ctaDiscount}</span>
            </h2>
            <p className="text-neutral-500 text-sm mb-2">sur toute la collection</p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="text-neutral-500 text-[13px] mb-10 max-w-xs leading-relaxed">{ctaSubtitle}</p>
            <div className="flex flex-wrap items-center gap-6">
              <Link href="/collection"
                className="inline-flex items-center justify-center bg-gold text-black font-bold text-[11px] uppercase tracking-[0.3em] px-10 py-5 hover:bg-gold-light active:scale-[0.98] transition-all duration-300">
                {ctaButton}
              </Link>
              <Link href="/collection"
                className="group text-neutral-500 text-[10px] uppercase tracking-[0.35em] hover:text-gold transition-colors duration-300 flex items-center gap-2.5">
                Voir la collection
                <span className="text-gold group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>
            <p className="text-neutral-700 text-[11px] mt-6 flex items-center gap-3">
              <span className="w-5 h-px bg-neutral-800 flex-shrink-0" />
              Livraison gratuite · Paiement à la livraison · Retours 7 jours
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          § 9  NEWSLETTER
      ══════════════════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-28 lg:py-36 border-t border-neutral-800/60" aria-label="Newsletter">
        <div className="max-w-xl mx-auto px-6 text-center">
          <Reveal>
            <GoldRule className="w-10 mx-auto mb-12" />
            <p className="text-[9px] uppercase tracking-[0.6em] text-neutral-600 mb-5">{newsletterSubtitle}</p>
            <h2 className="font-serif text-[clamp(28px,5vw,52px)] font-bold text-white leading-tight tracking-[-0.025em] mb-5">
              {newsletterTitle}
            </h2>
            <p className="text-neutral-500 text-[13px] leading-relaxed mb-10 max-w-sm mx-auto">{newsletterText}</p>
            <NewsletterForm />
            <p className="text-neutral-700 text-[11px] mt-6 tracking-wider">Pas de spam · Désabonnement en 1 clic</p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
