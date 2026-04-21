import { createClient, type SanityClient } from 'next-sanity'
import { env } from '../env'

let _client: SanityClient | null = null

export function getClient(): SanityClient {
  if (!_client) {
    _client = createClient({
      projectId:  env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset:    env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
      token:      env.SANITY_API_READ_TOKEN || undefined,
      useCdn:     process.env.NODE_ENV === 'production',
    })
  }
  return _client
}

// Eagerly-exported client for the image URL builder — safe because urlFor()
// is only called at render time (not at module evaluation).
export const client = {
  config: () => ({
    projectId:  env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset:    env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  }),
}
