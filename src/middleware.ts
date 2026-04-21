import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/session'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// ---------------------------------------------------------------------------
// Redis-backed sliding-window rate limiters (shared across all edge instances).
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
//
// Limits are configurable via env vars (defaults shown):
//   RATE_LIMIT_MAX          — max general API calls per IP per window (120)
//   RATE_LIMIT_WINDOW       — window duration in seconds for general API (60)
//   RATE_LIMIT_REVIEWS_MAX  — max review POSTs per IP per window (5)
//   RATE_LIMIT_LOGIN_MAX    — max login attempts per IP per 15-min window (5)
//
// Falls back to allow-all if Upstash env vars are not set (e.g. local dev
// without Redis). Set UPSTASH_REDIS_REST_URL to enable enforcement.
// ---------------------------------------------------------------------------

function parseEnvInt(key: string, fallback: number): number {
  const v = parseInt(process.env[key] ?? '', 10)
  return isNaN(v) || v <= 0 ? fallback : v
}

const MAX_API      = parseEnvInt('RATE_LIMIT_MAX', 120)
const WINDOW_S     = parseEnvInt('RATE_LIMIT_WINDOW', 60)
const MAX_REVIEWS  = parseEnvInt('RATE_LIMIT_REVIEWS_MAX', 5)
const MAX_LOGIN    = parseEnvInt('RATE_LIMIT_LOGIN_MAX', 5)
const MAX_LOGOUT   = 10  // per 60s — prevents logout-flood enumeration

// Lazily initialised — only created when env vars are present so the
// middleware still loads cleanly in local dev without Redis configured.
let apiLimiter:    Ratelimit | null = null
let reviewLimiter: Ratelimit | null = null
let loginLimiter:  Ratelimit | null = null
let logoutLimiter: Ratelimit | null = null

function getLimiters() {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  if (!apiLimiter) {
    const redis = new Redis({ url, token })
    apiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_API, `${WINDOW_S} s`),
      prefix:  'rl:api',
    })
    reviewLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REVIEWS, `${WINDOW_S} s`),
      prefix:  'rl:review',
    })
    loginLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_LOGIN, '900 s'),
      prefix:  'rl:login',
    })
    logoutLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_LOGOUT, `${WINDOW_S} s`),
      prefix:  'rl:logout',
    })
  }
  return { apiLimiter: apiLimiter!, reviewLimiter: reviewLimiter!, loginLimiter: loginLimiter!, logoutLimiter: logoutLimiter! }
}

// ---------------------------------------------------------------------------

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ---------------------------------------------------------------------------
// SSRF guard shared by import endpoints.
// Block requests to the same host as the app (but still allow them when the
// request comes from the embedded Sanity Studio on the same origin).
// ---------------------------------------------------------------------------
function isInternalOriginRequest(req: NextRequest): boolean {
  const host    = req.headers.get('host') ?? ''
  const origin  = req.headers.get('origin')  ?? ''
  const referer = req.headers.get('referer') ?? ''

  const sameOrigin = origin.includes(host) || referer.includes(host)
  const isLocal    = host.startsWith('localhost') || host.startsWith('127.')
  return sameOrigin || isLocal
}

// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = clientIp(req)

  // ── Admin route protection ────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const adminToken = req.cookies.get('atlas_admin')?.value
    const secret     = process.env.ADMIN_SECRET
    if (!secret || !(await verifySession(adminToken, secret))) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Block seed endpoint in production ────────────────────────────────────
  if (pathname.startsWith('/api/reviews/seed')) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 })
    }
  }

  // ── Restrict import endpoints to same-origin callers (Sanity Studio) ─────
  if (pathname.startsWith('/api/import-')) {
    if (!isInternalOriginRequest(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ── Redis rate limiting (no-op when Upstash is not configured) ───────────
  const limiters = getLimiters()

  if (limiters) {
    // Admin login — 5 attempts per 15 minutes
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const { success } = await limiters.loginLimiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
          { status: 429, headers: { 'Retry-After': '900' } },
        )
      }
    }

    // Admin logout — 10 per minute
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const { success } = await limiters.logoutLimiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans une minute.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        )
      }
    }

    // Review submissions — tighter window
    if (pathname === '/api/reviews' && req.method === 'POST') {
      const { success } = await limiters.reviewLimiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Trop de soumissions. Réessayez dans une minute.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        )
      }
    }

    // General API — checked last so specific limits above take priority
    if (pathname.startsWith('/api/')) {
      const { success } = await limiters.apiLimiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans une minute.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
