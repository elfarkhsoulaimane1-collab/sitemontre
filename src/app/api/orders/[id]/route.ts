import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { verifySession } from '@/lib/session'

const PROJECT_ID  = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID  ?? ''
const DATASET     = process.env.NEXT_PUBLIC_SANITY_DATASET      ?? 'production'
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION  ?? '2024-01-01'
const WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN          ?? ''

const VALID_STATUSES = new Set(['new', 'confirmed', 'shipped', 'delivered', 'cancelled'])

function getWriteClient() {
  return createClient({
    projectId:  PROJECT_ID,
    dataset:    DATASET,
    apiVersion: API_VERSION,
    token:      WRITE_TOKEN,
    useCdn:     false,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminToken = req.cookies.get('atlas_admin')?.value
  const secret     = process.env.ADMIN_SECRET
  if (!secret || !(await verifySession(adminToken, secret))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!WRITE_TOKEN) {
    return NextResponse.json({ error: 'SANITY_API_WRITE_TOKEN manquant' }, { status: 503 })
  }

  const { id } = await params

  let body: { status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  if (typeof body.status !== 'string' || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 422 })
  }

  try {
    const doc = await getWriteClient().patch(id).set({ status: body.status }).commit()
    return NextResponse.json({ _id: doc._id, status: doc.status })
  } catch (e) {
    const err = e as { message?: string; statusCode?: number }
    return NextResponse.json(
      { error: err.message ?? String(e) },
      { status: err.statusCode ?? 500 },
    )
  }
}
