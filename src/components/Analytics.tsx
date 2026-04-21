'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackPageView } from '@/lib/tracking'

interface Props {
  metaPixelId?:       string
  tiktokPixelId?:     string
  googleAnalyticsId?: string
  googleAdsId?:       string
}

// Re-fire page view on every client-side navigation, skipping the initial
// mount because the pixel init scripts already fire PageView on load.
function RouteChangeTracker() {
  const pathname = usePathname()
  const mounted  = useRef(false)
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    trackPageView()
  }, [pathname])
  return null
}

export default function Analytics({
  metaPixelId,
  tiktokPixelId,
  googleAnalyticsId,
  googleAdsId,
}: Props) {
  const sanitizeId = (id: string) => id.replace(/[^A-Za-z0-9_\-]/g, '')

  // Sanity values take priority; env vars are the fallback.
  // sanitizeId strips anything outside [A-Za-z0-9_-] to prevent script injection
  // via a compromised CMS value — legitimate pixel IDs are alphanumeric only.
  const META_PIXEL_ID   = sanitizeId(metaPixelId       || process.env.NEXT_PUBLIC_META_PIXEL_ID   || '')
  const TIKTOK_PIXEL_ID = sanitizeId(tiktokPixelId     || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '')
  const GA_ID           = sanitizeId(googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID           || '')
  const GADS_ID         = sanitizeId(googleAdsId       || process.env.NEXT_PUBLIC_GADS_ID         || '')

  return (
    <>
      <RouteChangeTracker />

      {/* ── Meta Pixel ──────────────────────────────────────────────────── */}
      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');
            `.trim(),
          }}
        />
      )}

      {/* ── TikTok Pixel ────────────────────────────────────────────────── */}
      {TIKTOK_PIXEL_ID && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._l=ttq._l||{};ttq._l[e]=new Date;
var r=document.createElement("script");r.type="text/javascript";r.async=!0;r.src=i+"?sdkid="+e;
var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a)};
ttq.load('${TIKTOK_PIXEL_ID}');ttq.page();
}(window,document,'ttq');
            `.trim(),
          }}
        />
      )}

      {/* ── Google (GA4 + Ads) — one gtag.js load, one init ───────────── */}
      {(GA_ID || GADS_ID) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID || GADS_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-tags"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: [
                'window.dataLayer=window.dataLayer||[];',
                'function gtag(){dataLayer.push(arguments);}',
                'gtag(\'js\',new Date());',
                GA_ID   ? `gtag('config','${GA_ID}',{send_page_view:true});`  : '',
                GADS_ID ? `gtag('config','${GADS_ID}');`                      : '',
                GADS_ID ? `window._gadsId='${GADS_ID}';`                     : '',
              ].filter(Boolean).join('\n'),
            }}
          />
        </>
      )}
    </>
  )
}
