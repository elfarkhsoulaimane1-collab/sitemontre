import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { sanityFetch } from '@/sanity/lib/fetch'
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY } from '@/sanity/lib/queries'
import { imageUrl } from '@/sanity/lib/image'
import { Post } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(POST_SLUGS_QUERY) ?? []
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await sanityFetch<Post>(POST_BY_SLUG_QUERY, { slug })
  if (!post) return {}
  return {
    title:       `${post.title} — Maison du Prestige`,
    description: post.excerpt ?? undefined,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await sanityFetch<Post>(POST_BY_SLUG_QUERY, { slug })
  if (!post) notFound()

  const img = imageUrl(post.mainImage, 1200)
  const date = new Date(post.publishedAt).toLocaleDateString('fr-MA', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero image */}
      {img && (
        <div className="relative w-full aspect-[21/9] bg-neutral-900 overflow-hidden">
          <Image
            src={img}
            alt={post.mainImage?.alt ?? post.title}
            fill
            unoptimized
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        {/* Back */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-900 transition-colors duration-200 mb-10"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tous les articles
        </Link>

        {/* Meta */}
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold mb-4">{date}</p>

        {/* Title */}
        <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 leading-tight mb-6">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-base text-neutral-500 leading-relaxed border-l-2 border-gold pl-4 mb-10">
            {post.excerpt}
          </p>
        )}

        {/* Divider */}
        <div className="h-px bg-stone-200 mb-10" />

        {/* Body */}
        {post.content?.length ? (
          <div className="prose-blog">
            <PortableText value={post.content} components={portableComponents} />
          </div>
        ) : (
          <p className="text-neutral-400 text-sm italic">Contenu non disponible.</p>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between flex-wrap gap-4">
          <Link href="/blog" className="btn-ghost text-xs">
            ← Retour au blog
          </Link>
          <Link href="/collection" className="btn-primary text-xs">
            Voir la collection
          </Link>
        </div>
      </article>
    </main>
  )
}

const portableComponents = {
  block: {
    normal:     ({ children }: { children?: React.ReactNode }) => <p className="text-neutral-700 text-[15px] leading-[1.85] mb-5">{children}</p>,
    h2:         ({ children }: { children?: React.ReactNode }) => <h2 className="font-serif text-2xl text-neutral-900 mt-10 mb-4 leading-snug">{children}</h2>,
    h3:         ({ children }: { children?: React.ReactNode }) => <h3 className="font-serif text-xl text-neutral-900 mt-8 mb-3 leading-snug">{children}</h3>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-2 border-gold pl-5 my-8 text-neutral-500 italic text-[15px] leading-relaxed">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
    em:     ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
    link:   ({ value, children }: { value?: { href?: string }; children?: React.ReactNode }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline underline-offset-2 hover:text-gold-dark transition-colors"
      >
        {children}
      </a>
    ),
  },
  types: {
    image: ({ value }: { value?: { asset?: unknown; alt?: string; caption?: string; hotspot?: unknown; crop?: unknown } }) => {
      const src = imageUrl(value, 900)
      if (!src) return null
      return (
        <figure className="my-10">
          <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
            <Image src={src} alt={value?.alt ?? ''} fill unoptimized className="object-cover" />
          </div>
          {value?.caption && (
            <figcaption className="text-center text-[11px] text-neutral-400 uppercase tracking-[0.15em] mt-3">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}
