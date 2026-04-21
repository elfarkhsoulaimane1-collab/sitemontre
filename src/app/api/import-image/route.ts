import { NextRequest, NextResponse } from 'next/server'

// ── SSRF guard ────────────────────────────────────────────────────────────────
// Reject requests that target private networks, loopback, or link-local ranges
// to prevent this proxy from being used as an internal network scanner.
const PRIVATE_HOST_RE =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|0\.0\.0\.0$|169\.254\.)/i

function isBlockedUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw)
    if (protocol !== 'https:' && protocol !== 'http:') return true
    return PRIVATE_HOST_RE.test(hostname)
  } catch {
    return true
  }
}

// Only proxy responses that are actual images.
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/gif', 'image/svg+xml',
])

// 10 MB max — prevents memory exhaustion from huge remote files.
const MAX_BYTES = 10 * 1024 * 1024

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  // Handle protocol-relative URLs
  if (url.startsWith('//')) url = 'https:' + url

  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 400 })
  }

  const referer = (() => { try { return new URL(url).origin } catch { return '' } })()

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':     'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    // Validate content-type before buffering
    const rawContentType = res.headers.get('content-type') ?? ''
    const mimeType = rawContentType.split(';')[0].trim().toLowerCase()
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Type de contenu non autorisé: ${mimeType}` },
        { status: 422 },
      )
    }

    // Cap size to avoid buffering huge payloads
    const contentLength = Number(res.headers.get('content-length') ?? '0')
    if (contentLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 10 Mo)' }, { status: 422 })
    }

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 10 Mo)' }, { status: 422 })
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':  mimeType,
        'Cache-Control': 'public, max-age=86400',
        // Prevent the browser from using the proxied image in a way that could
        // leak information back to the origin of the image.
        'Cross-Origin-Resource-Policy': 'same-site',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
