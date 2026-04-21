import { createImageUrlBuilder } from '@sanity/image-url'
import type { ImageSource } from '@/types'
import { client } from './client'

const config = client.config()

const builder = createImageUrlBuilder({
  projectId: config.projectId,
  dataset:   config.dataset,
})

export function urlFor(source: ImageSource) {
  return builder.image(source)
}

/**
 * Resolve a product image to a URL string.
 *
 * Accepts either:
 *  - A plain string (local fallback URLs, already-resolved CDN URLs)
 *  - A Sanity image object with asset->{ _id, url } (dereferenced via GROQ)
 *
 * Returns an empty string when source is nullish so components can guard with `src || fallback`.
 */
export function imageUrl(source: ImageSource | null | undefined, width?: number, quality = 80): string {
  if (!source) return ''
  if (typeof source === 'string') return source

  // Build a transformed URL via @sanity/image-url (uses asset._id or asset._ref)
  try {
    let img = urlFor(source).quality(quality).auto('format')
    if (width) img = img.width(width)
    const built = img.url()
    if (built) return built
  } catch { /* fall through */ }

  // Fallback: use the pre-resolved CDN URL from asset->url (no transformations)
  if (source.asset?.url) return source.asset.url

  return ''
}
