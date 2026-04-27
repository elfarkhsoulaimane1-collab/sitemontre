'use client'

import { createContext, useContext } from 'react'

const WatermarkContext = createContext<string | null>(null)

export function WatermarkProvider({
  logoSrc,
  children,
}: {
  logoSrc: string | null
  children: React.ReactNode
}) {
  return <WatermarkContext.Provider value={logoSrc}>{children}</WatermarkContext.Provider>
}

export function useWatermark() {
  return useContext(WatermarkContext)
}
