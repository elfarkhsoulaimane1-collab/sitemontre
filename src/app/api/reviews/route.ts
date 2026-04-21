import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'

// Read env vars directly — never use the shared env module for server-only
// secrets so we're certain the values come from the runtime environment,
// not a cached module evaluation.
const PROJECT_ID  = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID  ?? ''
const DATASET     = process.env.NEXT_PUBLIC_SANITY_DATASET      ?? 'production'
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION  ?? '2024-01-01'
const WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN          ?? ''

function getWriteClient() {
  return createClient({
    projectId:  PROJECT_ID,
    dataset:    DATASET,
    apiVersion: API_VERSION,
    token:      WRITE_TOKEN,
    useCdn:     false,
  })
}

// Extract the most useful fields from a Sanity client error.
function sanityErrDetails(e: unknown): { message: string; statusCode?: number; body?: unknown } {
  if (e && typeof e === 'object') {
    const err = e as Record<string, unknown>
    return {
      message:    String(err.message ?? e),
      statusCode: typeof err.statusCode === 'number' ? err.statusCode : undefined,
      body:       (err.response as Record<string, unknown> | undefined)?.body ?? err.details,
    }
  }
  return { message: String(e) }
}

// Strip any HTML/script tags and non-printable characters from user input
// to prevent stored XSS if the content is ever rendered without escaping.
function sanitize(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')                            // strip tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
}

export async function POST(req: NextRequest) {
  // ── pre-flight: configuration ──────────────────────────────────────────────
  if (!PROJECT_ID) {
    console.error('[reviews] Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
  }
  if (!WRITE_TOKEN) {
    console.error('[reviews] Missing SANITY_API_WRITE_TOKEN')
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
  }

  // ── parse body ─────────────────────────────────────────────────────────────
  let body: { name?: unknown; rating?: unknown; comment?: unknown; productId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { name, rating, comment, productId } = body

  // ── field validation ───────────────────────────────────────────────────────
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return NextResponse.json({ error: 'Nom invalide (2–80 caractères)' }, { status: 422 })
  }
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note invalide (1–5)' }, { status: 422 })
  }
  if (typeof comment !== 'string' || comment.trim().length < 10 || comment.trim().length > 1000) {
    return NextResponse.json({ error: 'Commentaire invalide (10–1000 caractères)' }, { status: 422 })
  }
  if (typeof productId !== 'string' || !productId.trim()) {
    return NextResponse.json({ error: 'productId manquant' }, { status: 422 })
  }

  // Strip "drafts." — Sanity strong references must point to a published doc ID.
  const ref = productId.trim().replace(/^drafts\./, '')

  const client = getWriteClient()

  // ── pre-flight: verify the product exists as a published document ──────────
  try {
    const exists = await client.fetch<{ _id: string } | null>(
      `*[_type == "product" && _id == $ref && !(_id in path("drafts.**"))][0]{ _id }`,
      { ref },
    )
    if (!exists) {
      console.error(`[reviews] product "${ref}" not found as a published document`)
      return NextResponse.json(
        { error: 'Produit introuvable ou non publié.' },
        { status: 422 },
      )
    }
  } catch (e) {
    const d = sanityErrDetails(e)
    console.error('[reviews] product lookup error:', d)
    return NextResponse.json({ error: 'Impossible de vérifier le produit.' }, { status: 502 })
  }

  // ── create review document ─────────────────────────────────────────────────
  try {
    const doc = await client.create({
      _type:    'review',
      name:     sanitize(name),
      rating,
      comment:  sanitize(comment),
      product:  { _type: 'reference', _ref: ref },
      approved: false,
    })
    return NextResponse.json({ id: doc._id }, { status: 201 })
  } catch (e) {
    const d = sanityErrDetails(e)
    console.error('[reviews] Sanity error:', d)
    return NextResponse.json(
      { error: 'Impossible de publier l\'avis. Réessayez.' },
      { status: d.statusCode ?? 500 },
    )
  }
}
