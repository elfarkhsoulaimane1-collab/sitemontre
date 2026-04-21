'use client'

import dynamic from 'next/dynamic'

// NextStudio and its config must live in the same client chunk so that
// process.env substitution and the Studio's React context both resolve
// correctly. Importing config at the top level of a 'use client' boundary
// that is also lazy-loaded can cause the projectId to be evaluated before
// Next.js has injected the env vars into the client bundle.
const StudioWithConfig = dynamic(
  async () => {
    const [{ NextStudio }, config] = await Promise.all([
      import('next-sanity/studio'),
      import('../../../../sanity.config'),
    ])
    function Studio() {
      return <NextStudio config={config.default} />
    }
    return Studio
  },
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: '100vh',
          background: '#101112',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontFamily: 'sans-serif',
          fontSize: 14,
        }}
      >
        Chargement du studio…
      </div>
    ),
  }
)

export default function StudioPage() {
  return <StudioWithConfig />
}
