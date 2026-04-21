import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  let body: { password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SECRET non configuré' }, { status: 503 })
  }
  const supplied = String(body.password ?? '')
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const sessionToken = await createSession(secret)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('atlas_admin', sessionToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  })
  return res
}
