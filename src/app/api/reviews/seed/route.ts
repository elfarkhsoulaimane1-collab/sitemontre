import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { pickSeedReviews } from '@/lib/reviewSeeds'

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

export async function POST(req: NextRequest) {
  // Never expose this endpoint in production — the middleware blocks it too,
  // but an explicit guard here prevents accidental exposure in any deployment.
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  if (!PROJECT_ID || !WRITE_TOKEN) {
    return NextResponse.json({ error: 'Sanity non configuré' }, { status: 503 })
  }

  let body: { productId?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  if (typeof body.productId !== 'string' || !body.productId.trim()) {
    return NextResponse.json({ error: 'productId manquant' }, { status: 422 })
  }

  // Strip drafts. prefix — we use the base ID for the weak reference.
  const ref = body.productId.trim().replace(/^drafts\./, '')

  const client = getWriteClient()

  // ── de-duplication: skip if seeded reviews already exist ─────────────────
  const existing = await client.fetch<number>(
    `count(*[_type == "review" && product._ref == $ref && seeded == true])`,
    { ref },
  )
  if (existing > 0) {
    return NextResponse.json({ skipped: true, existing }, { status: 200 })
  }

  // ── pick random count [5, 13] and build review docs ──────────────────────
  const count   = Math.floor(Math.random() * 9) + 5   // 5..13
  const reviews = pickSeedReviews(count)

  // Spread creation dates over the past 6 months so the list looks organic.
  const now     = Date.now()
  const sixMo   = 180 * 24 * 60 * 60 * 1000

  // Use a weak reference: the product may only exist as a draft at seed time.
  // Once published, Sanity strengthens the reference automatically.
  const docs = reviews.map((r, i) => ({
    _type:    'review',
    name:     r.name,
    rating:   5,
    comment:  r.comment,
    product:  { _type: 'reference', _ref: ref, _weak: true },
    approved: true,
    seeded:   true,
    // Synthetic date: spread evenly backwards so newest appears last.
    _createdAt: new Date(now - Math.floor((sixMo / count) * i)).toISOString(),
  }))

  try {
    const tx = client.transaction()
    for (const doc of docs) tx.create(doc)
    await tx.commit()
    return NextResponse.json({ created: docs.length }, { status: 201 })
  } catch (e) {
    const err = e as Record<string, unknown>
    console.error('[seed] transaction failed:', {
      message:    err?.message,
      statusCode: err?.statusCode,
      body:       (err?.response as Record<string, unknown> | undefined)?.body,
    })
    return NextResponse.json(
      { error: String(err?.message ?? e) },
      { status: (err?.statusCode as number) ?? 500 },
    )
  }
}
