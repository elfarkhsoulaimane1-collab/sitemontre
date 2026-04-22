import { env } from '../env'
import { getClient } from './client'

export function isSanityConfigured(): boolean {
  return !!(env.NEXT_PUBLIC_SANITY_PROJECT_ID && env.NEXT_PUBLIC_SANITY_DATASET)
}

const REVALIDATE = 60

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  if (!isSanityConfigured()) return null
  try {
    return await getClient().fetch<T>(query, params, {
      next: { revalidate: REVALIDATE },
    })
  } catch (err) {
    // Only log in development — production logs may be scraped by error trackers
    // and could surface internal query details. Wire up Sentry/Datadog instead.
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Sanity] fetch error:', err)
    }
    return null
  }
}
