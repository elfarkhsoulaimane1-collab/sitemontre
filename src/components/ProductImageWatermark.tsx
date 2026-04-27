'use client'

import { useWatermark } from '@/context/WatermarkContext'

export default function ProductImageWatermark() {
  const logoSrc = useWatermark()

  if (logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt=""
        aria-hidden="true"
        className="absolute top-2 right-2 z-50 pointer-events-none select-none w-[42px] md:w-[56px] object-contain opacity-60"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))', mixBlendMode: 'screen' }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 pointer-events-none select-none font-serif text-[7px] sm:text-[9px] uppercase tracking-[0.2em] text-white opacity-30"
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
    >
      Maison du Prestige
    </span>
  )
}
