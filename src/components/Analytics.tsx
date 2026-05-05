'use client'

// ---------------------------------------------------------------------------
// Analytics — loads third-party scripts only when the corresponding env var
// is set. Missing vars are safe: no script is injected, no runtime error.
//
// Add to .env.local (or Vercel → Settings → Environment Variables):
//   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX      ← Google Analytics 4 measurement ID
//   NEXT_PUBLIC_CLARITY_ID=XXXXXXXXXX   ← Microsoft Clarity project ID
//   NEXT_PUBLIC_GADS_ID=AW-XXXXXXXXX    ← Google Ads conversion ID (optional)
//   NEXT_PUBLIC_META_PIXEL_ID=          ← Meta Pixel ID (optional)
//   NEXT_PUBLIC_TIKTOK_PIXEL_ID=        ← TikTok Pixel ID (optional)
// ---------------------------------------------------------------------------

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, Suspense } from 'react'
import { trackPageView } from '@/lib/tracking'

interface Props {
  metaPixelId?:       string
  tiktokPixelId?:     string
  googleAnalyticsId?: string
  googleAdsId?:       string
}

// ---------------------------------------------------------------------------
// Route-change tracker.
// Wrapped in <Suspense> by the parent because useSearchParams() requires it.
// Fires on every pathname + search change, including the initial render.
// Sends GA4 page_view manually (config uses send_page_view:false to avoid
// the automatic event on init, which would duplicate on client navigation).
// ---------------------------------------------------------------------------
function RouteChangeTracker({ gaId }: { gaId: string }) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const search       = searchParams?.toString() ? `?${searchParams.toString()}` : ''
  const fullPath     = pathname + search
  const lastTracked  = useRef<string>('')

  useEffect(() => {
    if (lastTracked.current === fullPath) return
    lastTracked.current = fullPath

    // GA4 manual page_view — only when gtag is available.
    // gtag is defined in the afterInteractive inline script below;
    // window.gtag may not exist yet on the very first render if the browser
    // hasn't executed the inline script. Optional chaining silently no-ops.
    if (gaId) {
      window.gtag?.('event', 'page_view', {
        page_path:     fullPath,
        page_location: window.location.href,
        page_title:    document.title,
      })
    }

    // Meta Pixel PageView + TikTok page()
    trackPageView()
  }, [fullPath, gaId])

  return null
}

// ---------------------------------------------------------------------------
export default function Analytics({
  metaPixelId,
  tiktokPixelId,
  googleAnalyticsId,
  googleAdsId,
}: Props) {
  // sanitizeId prevents script injection via a compromised CMS value —
  // legitimate pixel/measurement IDs are alphanumeric + hyphens/underscores.
  const sanitizeId = (id: string) => id.replace(/[^A-Za-z0-9_\-]/g, '')

  // Sanity CMS values take priority; env vars are the fallback.
  const META_PIXEL_ID   = sanitizeId(metaPixelId       || process.env.NEXT_PUBLIC_META_PIXEL_ID   || '')
  const TIKTOK_PIXEL_ID = sanitizeId(tiktokPixelId     || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '')
  const GA_ID           = sanitizeId(googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID           || '')
  const GADS_ID         = sanitizeId(googleAdsId       || process.env.NEXT_PUBLIC_GADS_ID         || '')
  const CLARITY_ID      = sanitizeId(process.env.NEXT_PUBLIC_CLARITY_ID || '')

  return (
    <>
      {/* Route tracker — Suspense required by useSearchParams */}
      <Suspense fallback={null}>
        <RouteChangeTracker gaId={GA_ID} />
      </Suspense>

      {/* ── Microsoft Clarity ─────────────────────────────────────────────
          Lazy-loaded after page is fully interactive.
          Set NEXT_PUBLIC_CLARITY_ID to enable.                           */}
      {CLARITY_ID && (
        <Script
          id="ms-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${CLARITY_ID}");
            `.trim(),
          }}
        />
      )}

      {/* ── Meta Pixel ────────────────────────────────────────────────────
          Set NEXT_PUBLIC_META_PIXEL_ID to enable.                        */}
      {META_PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="lazyOnload"
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

      {/* ── TikTok Pixel ──────────────────────────────────────────────────
          Set NEXT_PUBLIC_TIKTOK_PIXEL_ID to enable.                      */}
      {TIKTOK_PIXEL_ID && (
        <Script
          id="tiktok-pixel"
          strategy="lazyOnload"
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

      {/* ── Google Analytics 4 + Ads ──────────────────────────────────────
          Loads gtag.js then initialises each configured property.
          send_page_view:false — RouteChangeTracker sends page_view manually
          so route changes in App Router are tracked correctly.
          Set NEXT_PUBLIC_GA_ID (and/or NEXT_PUBLIC_GADS_ID) to enable.   */}
      {(GA_ID || GADS_ID) && (
        <>
          <Script
            id="gtag-script"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID || GADS_ID}`}
            strategy="afterInteractive"
          />
          <Script
            id="gtag-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: [
                'window.dataLayer=window.dataLayer||[];',
                'function gtag(){dataLayer.push(arguments)}',
                'gtag("js",new Date());',
                GA_ID   ? `gtag("config","${GA_ID}",{send_page_view:false});`  : '',
                GADS_ID ? `gtag("config","${GADS_ID}");`                       : '',
                GADS_ID ? `window._gadsId="${GADS_ID}";`                       : '',
              ].filter(Boolean).join('\n'),
            }}
          />
        </>
      )}
    </>
  )
}
