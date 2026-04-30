'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false, loading: () => null })

export default function ClientChatWidget() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const cb = () => setReady(true)
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(cb, { timeout: 5000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(cb, 3000)
    return () => clearTimeout(id)
  }, [])

  return ready ? <ChatWidget /> : null
}
