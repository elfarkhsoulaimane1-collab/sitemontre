'use client'

import { useState } from 'react'
import { Review } from '@/types'

function StarRating({ rating, interactive = false, onChange, size = 'md' }: {
  rating:       number
  interactive?: boolean
  onChange?:    (r: number) => void
  size?:        'sm' | 'md' | 'lg'
}) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || rating) : rating
  const sz = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onChange?.(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
          aria-label={interactive ? `${n} étoile${n > 1 ? 's' : ''}` : undefined}
        >
          <svg className={`${sz} ${n <= display ? 'text-gold' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ reviews, productRating, productReviewCount, productId, canSubmit }: {
  reviews:            Review[]
  productRating:      number
  productReviewCount: number
  productId:          string
  canSubmit:          boolean
}) {
  const [name,    setName]    = useState('')
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [status,  setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || rating === 0 || comment.trim().length < 10) return
    setStatus('sending')
    setErrMsg('')
    try {
      const res = await fetch('/api/reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), rating, comment: comment.trim(), productId }),
      })
      const json = await res.json() as { id?: string; error?: string; details?: unknown }
      if (!res.ok) {
        const detail = json.details ? `\n${JSON.stringify(json.details, null, 2)}` : ''
        throw new Error(`${json.error ?? `HTTP ${res.status}`}${detail}`)
      }
      setStatus('sent')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  return (
    <div className="bg-neutral-900 py-16 lg:py-24 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {reviews.length > 0 && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-8 mb-12">
              <div>
                <p className="text-[10px] uppercase tracking-[0.5em] text-gold/70 mb-3">Ce que disent nos clients</p>
                <h2 className="font-serif text-3xl font-bold text-white leading-none tracking-[-0.025em]">
                  Avis clients vérifiés
                </h2>
              </div>

              {/* Rating summary */}
              <div className="sm:ml-auto flex items-center gap-6 border border-neutral-800 bg-neutral-950 px-8 py-5">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 mb-2">Note moyenne</p>
                  <p className="font-serif text-6xl text-white font-bold leading-none">{productRating}</p>
                  <div className="mt-3 flex justify-center">
                    <StarRating rating={productRating} size="sm" />
                  </div>
                  <p className="text-neutral-500 text-[11px] mt-2">{productReviewCount} avis vérifiés</p>
                </div>
              </div>
            </div>

            {/* Review cards */}
            <div className="grid md:grid-cols-3 gap-px bg-neutral-800 mb-14">
              {reviews.map(r => (
                <div key={r._id} className="bg-neutral-950 p-7 flex flex-col">
                  <StarRating rating={r.rating} size="md" />
                  <blockquote className="text-neutral-300 text-[15px] leading-relaxed mt-5 flex-1">
                    &ldquo;{r.comment}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-800">
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold font-bold text-base">{r.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{r.name}</p>
                      <p className="text-neutral-600 text-[10px] mt-0.5">
                        {new Date(r._createdAt).toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-emerald-400/8 border border-emerald-400/20 px-2 py-0.5 uppercase tracking-widest flex-shrink-0">
                      Vérifié
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Submit form */}
        {canSubmit && (
          <div className={`max-w-lg ${reviews.length > 0 ? 'border-t border-neutral-800 pt-12' : ''}`}>
            <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-8">Laisser un avis</p>
            {status === 'sent' ? (
              <div className="bg-neutral-900 border border-neutral-800 p-8 text-center">
                <p className="text-gold text-sm font-bold uppercase tracking-widest mb-2">Merci !</p>
                <p className="text-neutral-500 text-sm">Votre avis sera publié après modération.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Votre nom *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Mohammed Alami" maxLength={80} required
                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 font-medium placeholder-neutral-600 px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:bg-neutral-800 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-3">Note *</label>
                  <StarRating rating={rating} interactive onChange={setRating} size="lg" />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
                    Commentaire * <span className="normal-case text-neutral-600">(min. 10 caractères)</span>
                  </label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Partagez votre expérience avec cette montre…"
                    rows={4} maxLength={1000} required
                    className="w-full bg-neutral-900 border border-neutral-700 text-neutral-100 font-medium placeholder-neutral-600 px-4 py-3.5 text-sm focus:outline-none focus:border-gold focus:bg-neutral-800 transition-all resize-none" />
                  <p className="text-neutral-600 text-xs mt-1 text-right">{comment.length}/1000</p>
                </div>
                {status === 'error' && errMsg && (
                  <pre className="text-red-400 text-xs whitespace-pre-wrap break-all bg-red-950/40 border border-red-500/20 p-3">
                    {errMsg}
                  </pre>
                )}
                <button type="submit" disabled={status === 'sending'}
                  className="w-full py-4 bg-gold text-black font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  {status === 'sending' ? 'Envoi…' : 'Soumettre mon avis'}
                </button>
                <p className="text-neutral-600 text-xs text-center">Les avis sont modérés avant publication.</p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
