import { Resend } from 'resend'

interface OrderEmailPayload {
  orderRef:  string
  firstName: string
  lastName:  string
  phone:     string
  city:      string
  address:   string
  items:     string   // pre-formatted: "Product ×1"
  total:     number
  createdAt: string
}

export async function sendOrderNotificationEmail(payload: OrderEmailPayload): Promise<void> {
  const apiKey    = process.env.RESEND_API_KEY
  const toEmail   = process.env.ORDER_NOTIFICATION_EMAIL
  const fromEmail = process.env.FROM_EMAIL ?? 'commandes@maisonduprestige.com'

  if (!apiKey || !toEmail) return

  const resend = new Resend(apiKey)

  const date = new Date(payload.createdAt).toLocaleString('fr-MA', {
    timeZone:   'Africa/Casablanca',
    dateStyle:  'full',
    timeStyle:  'short',
  })

  const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
  <h2 style="color:#b8860b;margin-bottom:4px">Nouvelle commande — ${payload.orderRef}</h2>
  <p style="color:#666;margin-top:0">${date}</p>
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0"/>

  <h3 style="margin-bottom:8px">Client</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 0;color:#666;width:140px">Nom</td><td><strong>${payload.firstName} ${payload.lastName}</strong></td></tr>
    <tr><td style="padding:4px 0;color:#666">Téléphone</td><td>${payload.phone}</td></tr>
    <tr><td style="padding:4px 0;color:#666">Ville</td><td>${payload.city}</td></tr>
    <tr><td style="padding:4px 0;color:#666">Adresse</td><td>${payload.address}</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0"/>

  <h3 style="margin-bottom:8px">Articles</h3>
  <p style="margin:0">${payload.items}</p>

  <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0"/>

  <p style="font-size:18px;margin:0">
    Total : <strong style="color:#b8860b">${payload.total.toLocaleString('fr-MA')} MAD</strong>
    &nbsp;·&nbsp; <em>Paiement à la livraison</em>
  </p>
</div>
  `.trim()

  await resend.emails.send({
    from:    fromEmail,
    to:      toEmail,
    subject: `[Maison du Prestige] Commande ${payload.orderRef} — ${payload.firstName} ${payload.lastName}`,
    html,
  })
}
