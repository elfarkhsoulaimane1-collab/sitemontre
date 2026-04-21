import { NextRequest, NextResponse } from 'next/server'
import { isBlockedUrl } from '@/lib/ssrf'

const FETCH_TIMEOUT  = 9_000
const MAX_PAGES      = 8
const MAX_PRODUCTS   = 200
const TIME_BUDGET_MS = 22_000

// ── fetch helper ──────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  if (isBlockedUrl(url)) throw new Error('URL non autorisée')
  const res = await fetch(url, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
      'Cache-Control':   'no-cache',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// ── HTML/meta helpers ─────────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function getAllOg(html: string, prop: string): string[] {
  const re1 = new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'gi')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'gi')
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of [...html.matchAll(re1), ...html.matchAll(re2)]) {
    const v = decodeEntities(m[1].trim())
    if (v && !seen.has(v)) { seen.add(v); out.push(v) }
  }
  return out
}

function getMeta(html: string, name: string): string {
  const re1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
  return decodeEntities((html.match(re1) ?? html.match(re2))?.[1] ?? '')
}

function cleanTitle(s: string): string {
  return s.replace(/\s*[|\-–—]\s*.{0,80}$/, '').trim()
}

// ── slug from URL ─────────────────────────────────────────────────────────────

function slugFromUrl(u: string): string {
  try {
    const parts = new URL(u).pathname.split('/').filter(Boolean)
    return (parts[parts.length - 1] ?? '').replace(/\.\w+$/, '').slice(0, 96)
  } catch { return '' }
}

// ── image helpers ─────────────────────────────────────────────────────────────

/** Remove Shopify/WooCommerce size suffixes to get the full-resolution URL. */
function upgradeImageUrl(raw: string): string {
  // Shopify: _200x200.jpg → .jpg  |  _grande.jpg → .jpg
  return raw.replace(
    /_(pico|icon|thumb|small|compact|medium|large|grande|master|\d+x\d*|\d*x\d+)(\.\w+)/gi,
    '$2',
  )
}

function isProductImage(url: string): boolean {
  const lower = url.toLowerCase()
  if (/\/(icon|favicon|logo|sprite|pixel|tracker|beacon|badge|flag|avatar|placeholder|default|loading|blank)\b/i.test(lower)) return false
  if (/\b(1x1|tracking|analytics|impression)\b/i.test(lower)) return false
  if (/\.(svg|ico|gif)(\?|$)/i.test(lower)) return false
  return true
}

/** Return true when URL path encodes a tiny size (< 200px). */
function isTinyImage(url: string): boolean {
  const m = url.match(/_(\d+)x(\d+)/i)
  if (m) return Math.min(parseInt(m[1]), parseInt(m[2])) < 200
  const w = url.match(/[?&](?:width|w|size)=(\d+)/i)
  if (w) return parseInt(w[1]) < 200
  return false
}

function buildImageSet(
  ldImages:  string[],
  ogImages:  string[],
  htmlImages: string[],
  baseUrl:   string,
): string[] {
  const base = new URL(baseUrl)
  const seen = new Set<string>()
  const out: string[] = []

  function add(raw: string) {
    if (!raw) return
    if (raw.startsWith('//')) raw = 'https:' + raw
    if (raw.startsWith('data:')) return
    try {
      const u = new URL(raw.trim(), base)
      if (!['http:', 'https:'].includes(u.protocol)) return
      if (!isProductImage(u.toString())) return
      if (isTinyImage(u.toString())) return
      const upgraded = upgradeImageUrl(u.toString())
      // Dedup on path (ignore cache-busting query params)
      const key = (() => { try { const p = new URL(upgraded); return p.origin + p.pathname } catch { return upgraded } })()
      if (seen.has(key)) return
      seen.add(key)
      out.push(upgraded)
    } catch { /* skip invalid */ }
  }

  // Priority order: JSON-LD → OG → HTML
  ldImages.forEach(add)
  ogImages.forEach(add)
  htmlImages.forEach(add)
  return out
}

/** Comprehensive image extraction from raw HTML (img attrs + srcset + JSON blocks). */
function extractHtmlImages(html: string): string[] {
  const out: string[] = []

  // 1. <img> — all common lazy-load / zoom attributes
  const IMG_ATTRS = [
    'src', 'data-src', 'data-zoom', 'data-zoom-image', 'data-large',
    'data-large-image', 'data-original', 'data-lazy', 'data-image',
    'data-full', 'data-hi-res', 'data-highres', 'data-normal',
    'data-real-src', 'data-lazyload',
  ]
  for (const m of html.matchAll(/<img\b[^>]{0,4000}>/gi)) {
    const tag = m[0]
    for (const attr of IMG_ATTRS) {
      const vm = tag.match(new RegExp(`\\b${attr}=["']([^"'#{}\\s]+)["']`, 'i'))
      if (vm?.[1]) out.push(vm[1])
    }
  }

  // 2. <source srcset> (picture / responsive images)
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0]
      if (u) out.push(u)
    }
  }

  // 3. JSON-in-script blocks
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]{1,120000}?)<\/script>/gi)) {
    const src = m[1]

    // 3a. Explicit image/gallery/media arrays: "images": [...]
    for (const am of src.matchAll(/"(?:images?|gallery|media|photos?|slides?)"\s*:\s*(\[[^\]]{0,8000}\])/gi)) {
      try {
        const arr = JSON.parse(am[1]) as unknown[]
        for (const item of arr) {
          if (typeof item === 'string') { out.push(item); continue }
          if (item && typeof item === 'object') {
            const o = item as Record<string, unknown>
            for (const k of ['src', 'url', 'originalSrc', 'transformedSrc', 'original', 'full', 'zoom']) {
              if (typeof o[k] === 'string') out.push(o[k] as string)
            }
          }
        }
      } catch { /* malformed JSON */ }
    }

    // 3b. Bare https image URLs in scripts (last resort, wide net)
    for (const um of src.matchAll(/"(https?:\/\/[^"]{10,600}\.(?:jpe?g|png|webp)(?:\?[^"]{0,200})?)"/gi)) {
      out.push(um[1])
    }
  }

  return out
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function parseJsonLd(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim())
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of arr as Record<string, unknown>[]) {
        if (Array.isArray(item['@graph'])) nodes.push(...(item['@graph'] as Record<string, unknown>[]))
        else nodes.push(item)
      }
    } catch { /* skip */ }
  }
  return nodes
}

function extractLdImages(node: Record<string, unknown>): string[] {
  const seen = new Set<string>()
  const out:  string[] = []

  function imgUrl(v: unknown): string {
    if (typeof v === 'string') return v
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      return String(o.url ?? o.contentUrl ?? o['@id'] ?? '')
    }
    return ''
  }

  function add(v: unknown) {
    const u = imgUrl(v)
    if (u && !seen.has(u)) { seen.add(u); out.push(u) }
  }

  for (const field of ['image', 'photo', 'thumbnail', 'associatedMedia']) {
    const raw = node[field]
    if (!raw) continue
    if (Array.isArray(raw)) raw.forEach(add)
    else add(raw)
  }
  return out
}

// ── long description ──────────────────────────────────────────────────────────

function extractLongDescription(html: string): string {
  const PATTERNS = [
    /itemprop=["']description["'][^>]*>([\s\S]{50,5000}?)<\/(?:div|section|article|p)\b/i,
    /(?:id|class)=["'][^"']*product[_-]?desc[^"']*["'][^>]*>([\s\S]{50,5000}?)<\/(?:div|section|article)\b/i,
    /(?:id|class)=["'][^"']*description[^"']*["'][^>]*>([\s\S]{50,5000}?)<\/(?:div|section|article)\b/i,
  ]
  for (const re of PATTERNS) {
    const m = html.match(re)
    if (m) {
      return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
    }
  }
  return ''
}

// ── original / compare-at price ───────────────────────────────────────────────

function extractOriginalPrice(productLd: Record<string, unknown>, html: string): number | undefined {
  // 1. priceSpecification array (schema.org)
  const specs = productLd.priceSpecification
  if (Array.isArray(specs)) {
    for (const s of specs as Record<string, unknown>[]) {
      const p = parseFloat(String(s.price ?? ''))
      if (!isNaN(p) && p > 0) return p
    }
  }

  // 2. HTML: <del> / <s> / .compare-price / .original-price
  const HTML_PATTERNS = [
    /<(?:del|s|strike)\b[^>]*>([^<]{2,30}?)<\/(?:del|s|strike)>/gi,
    /class=["'][^"']*(?:compare|original|was|old|crossed)[^"']*["'][^>]*>([^<]{2,30}?)</gi,
  ]
  for (const re of HTML_PATTERNS) {
    for (const m of html.matchAll(re)) {
      const raw = m[1].replace(/[^\d.,]/g, '').replace(',', '.')
      const p = parseFloat(raw)
      if (!isNaN(p) && p > 0) return p
    }
  }

  return undefined
}

// ── product URL discovery ─────────────────────────────────────────────────────

const PRODUCT_SEGMENTS = [
  '/products/', '/product/', '/boutique/', '/shop/',
  '/catalogue/', '/p/', '/item/', '/article/', '/montre/', '/watch/',
]
const SKIP_SEGMENTS = [
  '/cart', '/account', '/search', '/blog', '/login', '/register',
  '/wishlist', '/collections$', '/category$', '/categories', '/page/',
]

function extractProductUrls(
  html:    string,
  nodes:   Record<string, unknown>[],
  baseUrl: string,
  seen:    Set<string>,
): string[] {
  const base = new URL(baseUrl)
  const out: string[] = []

  function add(raw: string) {
    try {
      const abs = new URL(raw.trim(), base)
      if (abs.host !== base.host) return
      if (abs.pathname === base.pathname) return
      if (SKIP_SEGMENTS.some(s => new RegExp(s, 'i').test(abs.pathname))) return
      const key = abs.origin + abs.pathname
      if (seen.has(key)) return
      seen.add(key)
      out.push(abs.href)
    } catch { /* ignore */ }
  }

  // 1. JSON-LD ItemList / CollectionPage
  for (const node of nodes) {
    const t = String(node['@type'] ?? '')
    if (!['ItemList', 'CollectionPage', 'ProductCollection', 'OfferCatalog'].includes(t)) continue
    const elements = node.itemListElement
    if (!Array.isArray(elements)) continue
    for (const el of elements as Record<string, unknown>[]) {
      const u = String(el.url ?? (el.item as Record<string, unknown> | undefined)?.url ?? '')
      if (u) add(u)
    }
  }

  // 2. Anchor hrefs that contain known product-path segments
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#?][^"']*?)["'][^>]*>/gi)) {
    if (PRODUCT_SEGMENTS.some(s => m[1].includes(s))) add(m[1])
  }

  return out
}

// ── pagination ────────────────────────────────────────────────────────────────

function findNextPageUrl(html: string, currentUrl: string): string | null {
  const base = new URL(currentUrl)

  // 1. <link rel="next">
  const linkNext = html.match(/<link[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']next["']/i)
  if (linkNext) {
    try { return new URL(linkNext[1], base).toString() } catch {}
  }

  // 2. Anchor with "next / suivant" text or class
  const NEXT_RE = [
    /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>\s*(?:Next|Suivant|التالي|›|»|→)\s*</gi,
    /<a\b[^>]*class=["'][^"']*(?:next-page|page-next|pagination[_-]next)[^"']*["'][^>]*href=["']([^"'#]+)["']/gi,
    /<a\b[^>]*href=["']([^"'#]+)["'][^>]*class=["'][^"']*(?:next-page|page-next|pagination[_-]next)[^"']*["']/gi,
    /rel=["']next["'][^>]*href=["']([^"']+)["']/gi,
    /href=["']([^"']+)["'][^>]*rel=["']next["']/gi,
  ]
  for (const re of NEXT_RE) {
    for (const m of html.matchAll(re)) {
      const href = m[1]
      if (!href || href === currentUrl) continue
      try { return new URL(href, base).toString() } catch {}
    }
  }

  // 3. Auto-increment: ?page=N or &page=N already in URL
  const pageMatch = currentUrl.match(/([?&]page=)(\d+)/)
  if (pageMatch) {
    const next = parseInt(pageMatch[2]) + 1
    return currentUrl.replace(/([?&]page=)\d+/, `$1${next}`)
  }

  // 4. Try appending ?page=2 if no page param exists (common on many platforms)
  if (!currentUrl.includes('page=')) {
    const sep = currentUrl.includes('?') ? '&' : '?'
    return `${currentUrl}${sep}page=2`
  }

  return null
}

// ── route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  if (isBlockedUrl(url)) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 400 })
  }

  let html: string
  try {
    html = await fetchHtml(url)
  } catch (e) {
    console.error('[import-url] fetch error:', e)
    return NextResponse.json({ error: 'Impossible de charger la page.' }, { status: 502 })
  }

  const nodes      = parseJsonLd(html)
  const productLd  = nodes.find(n => n['@type'] === 'Product')
  const collLd     = nodes.find(n =>
    ['CollectionPage', 'ItemList', 'Collection', 'OfferCatalog', 'ProductCollection']
      .includes(String(n['@type'] ?? '')),
  )

  const ogImages  = getAllOg(html, 'image')
  const ogTitle   = getAllOg(html, 'title')[0]         ?? ''
  const ogDesc    = getAllOg(html, 'description')[0]   ?? ''
  const htmlTitle = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? ''
  const metaDesc  = getMeta(html, 'description')

  const type: 'product' | 'collection' = productLd ? 'product' : 'collection'

  let name = '', description = '', longDescription = '', slug = ''
  let price: number | undefined, originalPrice: number | undefined, brand: string | undefined

  if (productLd) {
    name             = cleanTitle(String(productLd.name || ogTitle || htmlTitle))
    description      = String(productLd.description || ogDesc || metaDesc || '').slice(0, 600)
    longDescription  = extractLongDescription(html) || description
    slug             = slugFromUrl(url)
    brand            = typeof productLd.brand === 'string'
      ? productLd.brand
      : (productLd.brand as Record<string, unknown> | undefined)?.name as string | undefined

    const offerRaw = productLd.offers
    const offer = (Array.isArray(offerRaw) ? offerRaw[0] : offerRaw) as Record<string, unknown> | undefined
    if (offer?.price) price = parseFloat(String(offer.price))
    originalPrice = extractOriginalPrice(productLd, html)
  } else {
    const node  = collLd ?? {}
    name        = cleanTitle(String(node.name || ogTitle || htmlTitle))
    description = String(node.description || ogDesc || metaDesc || '').slice(0, 600)
  }

  const ldNode = (productLd ?? collLd) as Record<string, unknown> | undefined
  const images = buildImageSet(
    ldNode ? extractLdImages(ldNode) : [],
    ogImages,
    extractHtmlImages(html),
    url,
  )

  const result: Record<string, unknown> = {
    type,
    name:            name.slice(0, 200),
    description,
    longDescription: longDescription.slice(0, 2000),
    price,
    originalPrice,
    brand,
    slug,
    images:          images.slice(0, 40),
    sourceUrl:       url,
  }

  if (type === 'collection') {
    const start     = Date.now()
    const seenUrls  = new Set<string>([new URL(url).origin + new URL(url).pathname])
    const productUrls = extractProductUrls(html, nodes, url, seenUrls)
    let currentHtml = html
    let currentUrl  = url
    let pagesScanned = 1

    while (productUrls.length < MAX_PRODUCTS && pagesScanned < MAX_PAGES) {
      if (Date.now() - start > TIME_BUDGET_MS) break

      const nextUrl = findNextPageUrl(currentHtml, currentUrl)
      if (!nextUrl) break
      // Avoid re-fetching the same page (auto-increment could loop forever on last page)
      const nextKey = (() => { try { const u = new URL(nextUrl); return u.origin + u.pathname + u.search } catch { return nextUrl } })()
      if (seenUrls.has(nextKey)) break
      seenUrls.add(nextKey)

      try {
        const nextHtml = await fetchHtml(nextUrl)
        const nextNodes = parseJsonLd(nextHtml)
        const found = extractProductUrls(nextHtml, nextNodes, nextUrl, seenUrls)
        if (found.length === 0) break
        productUrls.push(...found)
        currentHtml = nextHtml
        currentUrl  = nextUrl
        pagesScanned++
      } catch { break }
    }

    result.productUrls  = productUrls.slice(0, MAX_PRODUCTS)
    result.pagesScanned = pagesScanned
  }

  return NextResponse.json(result)
}
