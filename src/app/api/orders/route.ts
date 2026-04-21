import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from 'next-sanity'
import { verifySession } from '@/lib/session'
import { isBlockedUrl } from '@/lib/ssrf'

// Read env vars inside functions, not at module level.
// NEXT_PUBLIC_* vars inlined at build time can be empty strings when read as
// module-level constants in API routes built before .env.local is loaded.
function getConfig() {
  return {
    projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID  ?? '',
    dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET      ?? 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION  ?? '2024-01-01',
    writeToken: process.env.SANITY_API_WRITE_TOKEN          ?? '',
  }
}

function getWriteClient() {
  const { projectId, dataset, apiVersion, writeToken } = getConfig()
  return createClient({ projectId, dataset, apiVersion, token: writeToken, useCdn: false })
}

function getReadClient() {
  const { projectId, dataset, apiVersion, writeToken } = getConfig()
  return createClient({ projectId, dataset, apiVersion, token: writeToken, useCdn: false })
}

// ── GET /api/orders — admin-only ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const adminToken = req.cookies.get('atlas_admin')?.value
  const secret     = process.env.ADMIN_SECRET
  if (!secret || !(await verifySession(adminToken, secret))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { projectId } = getConfig()
  if (!projectId) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SANITY_PROJECT_ID manquant' }, { status: 503 })
  }
  try {
    const orders = await getReadClient().fetch(
      `*[_type == "order"] | order(_createdAt desc) [0...50] { _id, orderRef, status, createdAt, firstName, lastName, total }`,
    )
    return NextResponse.json({ count: orders?.length ?? 0, orders })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ── Payload type ──────────────────────────────────────────────────────────────

interface RawItem {
  productName?: unknown
  quantity?:    unknown
  unitPrice?:   unknown
  totalPrice?:  unknown
}

interface RawBody {
  orderRef?:  unknown
  firstName?: unknown
  lastName?:  unknown
  phone?:     unknown
  city?:      unknown
  address?:   unknown
  notes?:     unknown
  items?:     unknown
  subtotal?:  unknown
  shipping?:  unknown
  total?:     unknown
}

// ── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { projectId, writeToken } = getConfig()

  if (!projectId) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SANITY_PROJECT_ID manquant — vérifiez .env.local' },
      { status: 503 },
    )
  }

  if (!writeToken) {
    return NextResponse.json(
      { error: 'SANITY_API_WRITE_TOKEN manquant — vérifiez .env.local' },
      { status: 503 },
    )
  }

  let body: RawBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { orderRef, firstName, lastName, phone, city, address, notes, items, subtotal, shipping, total } = body

  // ── Validate required fields ────────────────────────────────────────────────
  if (typeof orderRef  !== 'string' || !orderRef.trim())  return NextResponse.json({ error: 'orderRef manquant' },  { status: 422 })
  if (typeof firstName !== 'string' || !firstName.trim()) return NextResponse.json({ error: 'firstName manquant' }, { status: 422 })
  if (typeof lastName  !== 'string' || !lastName.trim())  return NextResponse.json({ error: 'lastName manquant' },  { status: 422 })
  if (typeof phone     !== 'string' || !phone.trim())     return NextResponse.json({ error: 'phone manquant' },     { status: 422 })
  if (typeof city      !== 'string' || !city.trim())      return NextResponse.json({ error: 'city manquant' },      { status: 422 })
  if (typeof address   !== 'string' || !address.trim())   return NextResponse.json({ error: 'address manquant' },   { status: 422 })
  if (!Array.isArray(items) || items.length === 0)        return NextResponse.json({ error: 'items manquant' },     { status: 422 })
  if (typeof total !== 'number')                          return NextResponse.json({ error: 'total manquant' },     { status: 422 })

  // ── Max length guards ───────────────────────────────────────────────────────
  if (firstName.trim().length > 100) return NextResponse.json({ error: 'firstName trop long (max 100)' }, { status: 400 })
  if (lastName.trim().length  > 100) return NextResponse.json({ error: 'lastName trop long (max 100)' },  { status: 400 })
  if (phone.trim().length     > 100) return NextResponse.json({ error: 'phone trop long (max 100)' },     { status: 400 })
  if (city.trim().length      > 100) return NextResponse.json({ error: 'city trop long (max 100)' },      { status: 400 })
  if (address.trim().length   > 100) return NextResponse.json({ error: 'address trop long (max 100)' },   { status: 400 })
  if (items.length            >  20) return NextResponse.json({ error: 'Trop d\'articles (max 20)' },     { status: 400 })

  const safeItems = (items as RawItem[]).map((i) => ({
    _key:        Math.random().toString(36).slice(2, 10),
    productName: String(i.productName ?? ''),
    quantity:    Number(i.quantity    ?? 0),
    unitPrice:   Number(i.unitPrice   ?? 0),
    totalPrice:  Number(i.totalPrice  ?? 0),
  }))

  // ── Create order document in Sanity ─────────────────────────────────────────
  let orderId: string
  try {
    const doc = await getWriteClient().create({
      _type:     'order',
      orderRef:  orderRef.trim(),
      status:    'new',
      createdAt: new Date().toISOString(),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone.trim(),
      city:      city.trim(),
      address:   address.trim(),
      notes:     typeof notes === 'string' ? notes.trim() : '',
      items:     safeItems,
      subtotal:  Number(subtotal ?? 0),
      shipping:  Number(shipping ?? 0),
      total:     Number(total),
    })
    orderId = doc._id
  } catch (e) {
    console.error('[ORDER] Sanity error:', e)
    return NextResponse.json(
      { error: 'Impossible d\'enregistrer la commande. Réessayez.' },
      { status: 500 },
    )
  }

  // ── Webhook runs after the response is sent ───────────────────────────────
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (webhookUrl) {
    const webhookPayload = {
      orderRef:  orderRef.trim(),
      createdAt: new Date().toISOString(),
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone.trim(),
      city:      city.trim(),
      address:   address.trim(),
      notes:     typeof notes === 'string' ? notes.trim() : '',
      items:     safeItems.map(i => `${i.productName} ×${i.quantity}`).join(', '),
      subtotal:  Number(subtotal ?? 0),
      shipping:  Number(shipping ?? 0),
      total:     Number(total),
    }
    after(async () => {
      if (isBlockedUrl(webhookUrl)) {
        console.error('[ORDER] Sheets webhook URL blocked by SSRF guard')
        return
      }
      try {
        const res = await fetch(webhookUrl, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(webhookPayload),
          redirect: 'follow',
          signal:  AbortSignal.timeout(8_000),
        })
        if (!res.ok) console.error('[ORDER] Sheets webhook failed:', res.status)
      } catch (err) {
        console.error('[ORDER] Sheets webhook error:', err instanceof Error ? err.message : String(err))
      }
    })
  }

  return NextResponse.json({ id: orderId, orderRef: orderRef.trim() }, { status: 201 })
}
