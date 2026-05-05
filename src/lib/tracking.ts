// ---------------------------------------------------------------------------
// Tracking utility — Meta Pixel, TikTok Pixel, Google Analytics, MS Clarity
//
// Set these env vars in .env.local:
//   NEXT_PUBLIC_META_PIXEL_ID=your_id
//   NEXT_PUBLIC_TIKTOK_PIXEL_ID=your_id
//   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
//   NEXT_PUBLIC_GADS_ID=AW-XXXXXXXXXX
//   NEXT_PUBLIC_CLARITY_ID=your_id
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    fbq?:     (cmd: string, event: string, params?: Record<string, unknown>) => void
    ttq?: {
      page:  ()                                                          => void
      track: (event: string, params?: Record<string, unknown>)          => void
    }
    gtag?:    (cmd: string, action: string, params?: Record<string, unknown>) => void
    clarity?: (cmd: string, ...args: unknown[]) => void
    dataLayer?: unknown[]
    _gadsId?: string
  }
}

export interface PurchasePayload {
  orderId:     string
  productId:   string
  productName: string
  value:       number
  currency?:   string
}

export interface ViewContentPayload {
  productId:   string
  productName: string
  value:       number
  currency?:   string
}

export interface InitiateCheckoutPayload {
  productId:   string
  productName: string
  value:       number
  currency?:   string
}

export interface AddToCartPayload {
  productId:   string
  productName: string
  value:       number
  currency?:   string
}

// Safe guard — only call on client, only when pixel is ready
function isBrowser() {
  return typeof window !== 'undefined'
}

// ── Page view ────────────────────────────────────────────────────────────────
// Called automatically on every route change by Analytics.tsx.
export function trackPageView() {
  if (!isBrowser()) return
  window.fbq?.('track', 'PageView')
  window.ttq?.page()
  // GA page_view is emitted automatically by gtag config; no manual call needed.
}

// ── View product ─────────────────────────────────────────────────────────────
// Fire when a product detail page is displayed — feeds retargeting audiences.
export function trackViewContent({ productId, productName, value, currency = 'MAD' }: ViewContentPayload) {
  if (!isBrowser()) return

  window.fbq?.('track', 'ViewContent', {
    content_ids:  [productId],
    content_name: productName,
    content_type: 'product',
    value,
    currency,
  })

  window.ttq?.track('ViewContent', {
    content_id:   productId,
    content_name: productName,
    value,
    currency,
  })

  window.gtag?.('event', 'view_item', {
    currency,
    value,
    items: [{ item_id: productId, item_name: productName, price: value, quantity: 1 }],
  })
}

// Alias used in product pages
export const trackViewProduct = trackViewContent

// ── Add to cart ───────────────────────────────────────────────────────────────
export function trackAddToCart({ productId, productName, value, currency = 'MAD' }: AddToCartPayload) {
  if (!isBrowser()) return

  window.fbq?.('track', 'AddToCart', {
    content_ids:  [productId],
    content_name: productName,
    content_type: 'product',
    value,
    currency,
  })

  window.ttq?.track('AddToCart', {
    content_id:   productId,
    content_name: productName,
    value,
    currency,
  })

  window.gtag?.('event', 'add_to_cart', {
    currency,
    value,
    items: [{ item_id: productId, item_name: productName, price: value, quantity: 1 }],
  })
}

// ── Initiate checkout ────────────────────────────────────────────────────────
// Fire on first interaction with the order form — signals high intent.
export function trackInitiateCheckout({ productId, productName, value, currency = 'MAD' }: InitiateCheckoutPayload) {
  if (!isBrowser()) return

  window.fbq?.('track', 'InitiateCheckout', {
    content_ids:  [productId],
    content_name: productName,
    content_type: 'product',
    value,
    currency,
    num_items: 1,
  })

  window.ttq?.track('InitiateCheckout', {
    content_id:   productId,
    content_name: productName,
    value,
    currency,
  })

  window.gtag?.('event', 'begin_checkout', {
    currency,
    value,
    items: [{ item_id: productId, item_name: productName, price: value, quantity: 1 }],
  })
}

// Alias used in product pages
export const trackBeginCheckout = trackInitiateCheckout

// ── WhatsApp click ───────────────────────────────────────────────────────────
export function trackWhatsAppClick() {
  if (!isBrowser()) return

  window.gtag?.('event', 'whatsapp_click', { event_category: 'engagement' })
  window.fbq?.('trackCustom', 'WhatsAppClick')
  window.ttq?.track('ClickButton')
  window.clarity?.('event', 'whatsapp_click')
}

// ── CTA click ────────────────────────────────────────────────────────────────
export function trackCTAClick(label: string) {
  if (!isBrowser()) return

  window.gtag?.('event', 'cta_click', { event_category: 'engagement', event_label: label })
  window.clarity?.('event', `cta_${label}`)
}

// ── Purchase ─────────────────────────────────────────────────────────────────
// Fire on successful COD form submission.
export function trackPurchase({ orderId, productId, productName, value, currency = 'MAD' }: PurchasePayload) {
  if (!isBrowser()) return

  const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ''))
  const safeValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1

  const purchasePayload = {
    content_ids:  [productId],
    content_name: productName,
    content_type: 'product',
    value:        safeValue,
    currency:     'MAD',
  }

  const fbPayload = {
    content_ids:  [productId],
    content_name: productName,
    content_type: 'product',
    value:        Math.round((safeValue / 10) * 100) / 100,
    currency:     'USD',
  }

  console.log('META_PURCHASE_PAYLOAD', purchasePayload)
  console.log('META_PURCHASE_FB_PAYLOAD', fbPayload)
  console.log('META_PURCHASE_FIRED', { fbqReady: typeof window.fbq })
  window.fbq?.('track', 'Purchase', fbPayload)
  console.log('META_PURCHASE_FIRED', 'fbq Purchase call complete')

  window.ttq?.track('PlaceAnOrder', {
    content_id:   productId,
    content_name: productName,
    value:        safeValue,
    currency:     'MAD',
  })

  window.gtag?.('event', 'purchase', {
    transaction_id: orderId,
    value:          safeValue,
    currency:       'MAD',
    items: [{ item_id: productId, item_name: productName, price: safeValue, quantity: 1 }],
  })

  window.clarity?.('event', 'purchase')

  // Google Ads conversion — resolved from runtime window var or build-time env
  const gadsId = window._gadsId || process.env.NEXT_PUBLIC_GADS_ID
  if (gadsId) {
    window.gtag?.('event', 'conversion', {
      send_to:        `${gadsId}/purchase`,
      transaction_id: orderId,
      value:          safeValue,
      currency:       'MAD',
    })
  }
}
