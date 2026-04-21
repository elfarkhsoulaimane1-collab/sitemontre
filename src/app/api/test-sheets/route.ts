import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/session'

// ── GET /api/test-sheets ──────────────────────────────────────────────────────
// Fires a dummy payload to GOOGLE_SHEETS_WEBHOOK_URL synchronously and returns
// the full result so you can confirm the webhook works without placing a real order.
// Protected by the atlas_admin cookie — same auth as /admin/orders.
// Remove this file once the Google Sheets integration is confirmed working.

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const adminToken = req.cookies.get('atlas_admin')?.value
  const secret     = process.env.ADMIN_SECRET
  if (!secret || !(await verifySession(adminToken, secret))) {
    return NextResponse.json({ error: 'Non autorisé — connectez-vous à /admin/login d\'abord' }, { status: 401 })
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({
      ok:      false,
      error:   'GOOGLE_SHEETS_WEBHOOK_URL is not set in .env.local',
    }, { status: 503 })
  }

  const testPayload = {
    orderRef:  'ATL-TEST-WEBHOOK',
    createdAt: new Date().toISOString(),
    firstName: 'Test',
    lastName:  'Prestige',
    phone:     '0612345678',
    city:      'Casablanca',
    address:   '123 Rue Test, Maarif',
    notes:     'Ceci est un test webhook — pas une vraie commande',
    items:     'Montre Atlas Classic ×1',
    subtotal:  1200,
    shipping:  0,
    total:     1200,
  }

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(testPayload),
      redirect: 'follow',
      signal:  AbortSignal.timeout(8_000),
    })

    const responseBody = await res.text().catch(() => '')

    return NextResponse.json({
      ok:           res.ok,
      status:       res.status,
      payload:      testPayload,
      responseBody: responseBody.slice(0, 500),
      message:      res.ok
        ? '✓ Webhook OK — vérifiez votre Google Sheet pour la ligne de test'
        : `✗ Webhook failed — HTTP ${res.status}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      ok:      false,
      error:   message,
      message: `✗ Webhook threw: ${message}`,
    }, { status: 502 })
  }
}
