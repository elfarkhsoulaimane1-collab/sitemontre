/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,

  experimental: {
    optimizeCss: true,
  },

  allowedDevOrigins: ['cdn.sanity.io'],

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
  },

  compress: true,

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.maisonduprestige.com' }],
        destination: 'https://maisonduprestige.com/:path*',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Allow same-origin framing only (Sanity Studio uses iframes internally)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Legacy XSS filter (belt-and-suspenders)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unused browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // HSTS — 2 years, including subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Restrict base tag injection, form hijacking, and framing via CSP directives
          // (script-src intentionally omitted — pixel SDKs require unsafe-inline;
          //  add a nonce-based policy via middleware once pixel scripts are server-rendered)
          {
            key: 'Content-Security-Policy',
            value: [
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      // Aggressive caching for Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
