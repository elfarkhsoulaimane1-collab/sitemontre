export const env = {
  NEXT_PUBLIC_SANITY_PROJECT_ID:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID  ?? '',
  NEXT_PUBLIC_SANITY_DATASET:     process.env.NEXT_PUBLIC_SANITY_DATASET      ?? 'production',
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION  ?? '2024-01-01',
  SANITY_API_READ_TOKEN:          process.env.SANITY_API_READ_TOKEN           ?? '',
  SANITY_API_WRITE_TOKEN:         process.env.SANITY_API_WRITE_TOKEN          ?? '',
}
