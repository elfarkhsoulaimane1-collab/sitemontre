'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setEmail('')
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-amber-400 font-bold text-sm tracking-widest uppercase">
          ✓ Bienvenue dans la famille Maison du Prestige !
        </p>
        <p className="text-neutral-500 text-xs mt-2">
          Vous serez les premiers informés de nos nouveautés.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre adresse email"
        className="input-field flex-1"
        required
      />
      <button type="submit" className="btn-primary whitespace-nowrap">
        S&apos;inscrire
      </button>
    </form>
  )
}
