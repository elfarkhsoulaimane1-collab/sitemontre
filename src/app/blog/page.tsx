import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { sanityFetch } from '@/sanity/lib/fetch'
import { ALL_POSTS_QUERY } from '@/sanity/lib/queries'
import { imageUrl } from '@/sanity/lib/image'
import { PostCard } from '@/types'

export const metadata: Metadata = {
  title: 'Blog — Maison du Prestige',
  description: 'Articles, conseils et actualités horlogères par Maison du Prestige.',
}

export default async function BlogPage() {
  const posts = await sanityFetch<PostCard[]>(ALL_POSTS_QUERY) ?? []

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="bg-neutral-950 py-20 px-4 text-center">
        <p className="section-subtitle text-gold/70">Notre univers</p>
        <h1 className="section-title text-white mt-2">Le Blog</h1>
        <p className="text-neutral-400 text-sm mt-4 max-w-md mx-auto">
          Articles, conseils et actualités autour de l&apos;horlogerie de prestige.
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCardItem key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function PostCardItem({ post }: { post: PostCard }) {
  const img = imageUrl(post.mainImage, 600)
  const date = new Date(post.publishedAt).toLocaleDateString('fr-MA', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col bg-white border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
        {img ? (
          <Image
            src={img}
            alt={post.mainImage?.alt ?? post.title}
            fill
            unoptimized
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            <span className="text-gold/30 text-4xl font-serif">M</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-3">{date}</p>
        <h2 className="font-serif text-lg text-neutral-900 leading-snug group-hover:text-gold transition-colors duration-300 mb-3">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>
        )}
        <span className="mt-4 text-[11px] uppercase tracking-[0.18em] text-gold font-semibold flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300">
          Lire l&apos;article
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full border border-stone-200 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h2 className="font-serif text-xl text-neutral-700 mb-2">Aucun article pour le moment</h2>
      <p className="text-sm text-neutral-400 max-w-xs">
        Nos premiers articles arrivent bientôt. Revenez nous voir.
      </p>
      <Link href="/" className="mt-8 btn-dark text-xs">
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
