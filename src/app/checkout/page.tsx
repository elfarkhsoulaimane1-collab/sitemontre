'use client'

// ── WhatsApp destination ───────────────────────────────────────────────────
// Set NEXT_PUBLIC_WHATSAPP_NUMBER in your environment (format: 212XXXXXXXXX,
// no + or spaces).  The placeholder below is intentionally obvious so the
// site won't silently route orders to a wrong number if the env var is unset.
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '212600000000'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { imageUrl } from '@/sanity/lib/image'
import { MOROCCAN_CITIES } from '@/data/products'
import { CheckoutForm } from '@/types'
import { trackPurchase, trackInitiateCheckout } from '@/lib/tracking'

type Step = 'form' | 'success'

const INITIAL_FORM: CheckoutForm = {
  firstName: '',
  lastName: '',
  phone: '',
  city: '',
  address: '',
  notes: '',
  whatsappConfirm: true,
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({})
  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState('')
  const [orderRef] = useState(
    () => `ATL-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
  )
  const checkoutFired = useRef(false)

  const shipping   = total >= 500 ? 0 : 50
  const orderTotal = total + shipping

  function handleFormFocus() {
    if (checkoutFired.current) return
    checkoutFired.current = true
    trackInitiateCheckout({
      productId:   'cart',
      productName: 'Cart',
      value:       orderTotal,
    })
  }

  function validate(): boolean {
    const e: Partial<CheckoutForm> = {}
    if (!form.firstName.trim()) e.firstName = 'Prénom requis'
    if (!form.lastName.trim())  e.lastName  = 'Nom requis'
    if (!form.phone.trim()) {
      e.phone = 'Téléphone requis'
    } else if (!/^(\+?212[67][0-9]{8}|0[67][0-9]{8}|[67][0-9]{8})$/.test(form.phone.replace(/[\s\-]/g, ''))) {
      e.phone = 'Format invalide (ex: 0612345678 ou 612345678)'
    }
    if (!form.city)            e.city    = 'Ville requise'
    if (!form.address.trim())  e.address = 'Adresse requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return

    const snapshot = {
      items: items.map(i => ({
        productName: i.product.name,
        quantity:    i.quantity,
        unitPrice:   i.product.price,
        totalPrice:  i.product.price * i.quantity,
      })),
      tracking: items.map(i => ({
        orderId:     orderRef,
        productId:   i.product.id,
        productName: i.product.name,
        value:       i.product.price * i.quantity,
      })),
    }

    const orderPayload = {
      orderRef,
      firstName: form.firstName,
      lastName:  form.lastName,
      phone:     form.phone,
      city:      form.city,
      address:   form.address,
      notes:     form.notes,
      items:     snapshot.items,
      subtotal:  total,
      shipping,
      total:     orderTotal,
    }

    setSubmitting(true)
    setApiError('')

    let saved = false
    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(orderPayload),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        saved = true
      } else {
        setApiError(data.error ?? `Erreur serveur (${res.status})`)
      }
    } catch {
      setApiError('Erreur réseau — vérifiez votre connexion et réessayez.')
    } finally {
      setSubmitting(false)
    }

    if (saved) {
      clearCart()
      setStep('success')
      snapshot.tracking.forEach(p => trackPurchase(p))
    }
  }

  if (items.length === 0 && step === 'form') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-serif text-3xl text-neutral-900 mb-4">Panier vide</h1>
        <p className="text-neutral-500 text-sm mb-8">
          Ajoutez des articles avant de passer commande.
        </p>
        <Link href="/collection" className="btn-dark">
          Voir la collection
        </Link>
      </div>
    )
  }

  if (step === 'success') {
    const whatsappMsg = encodeURIComponent(
      `Bonjour Maison du Prestige 👋\nNouvelle commande confirmée !\n\nRéf: ${orderRef}\nClient: ${form.firstName} ${form.lastName}\nTél: ${form.phone}\nVille: ${form.city}\nAdresse: ${form.address}\n\nArticles:\n${
        items.length > 0
          ? items
              .map(
                (i) =>
                  `• ${i.product.name} ×${i.quantity} — ${(
                    i.product.price * i.quantity
                  ).toLocaleString('fr-MA')} MAD`
              )
              .join('\n')
          : 'Voir commande'
      }\n\nTotal: ${orderTotal.toLocaleString('fr-MA')} MAD (Paiement à la livraison)`
    )

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-500 flex items-center justify-center mb-8 mx-auto">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3">Commande confirmée</p>
        <h1 className="font-serif text-4xl text-neutral-900 font-bold mb-4">
          Merci, {form.firstName} !
        </h1>
        <p className="text-neutral-500 text-sm max-w-md mb-6 leading-relaxed">
          Votre commande <span className="text-gold font-bold">{orderRef}</span> a
          été reçue. Notre équipe vous contactera sous 24h pour confirmer la livraison.
        </p>

        <div className="bg-white border border-stone-200 shadow-luxury p-6 mb-8 text-left max-w-md w-full space-y-3">
          <h2 className="font-serif text-lg text-neutral-900 mb-4">Récapitulatif</h2>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Référence</span>
            <span className="text-neutral-900 font-bold">{orderRef}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Livraison</span>
            <span className="text-neutral-900">
              {form.city} — {form.address}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Paiement</span>
            <span className="text-neutral-900">À la livraison (COD)</span>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-stone-200">
            <span className="font-bold text-neutral-900">Total à payer</span>
            <span className="font-serif text-xl text-gold">
              {orderTotal.toLocaleString('fr-MA')} MAD
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {form.whatsappConfirm && (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-green-500 transition-colors duration-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Confirmer sur WhatsApp
            </a>
          )}
          <Link href="/" className="btn-ghost">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-12 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-gold text-xs uppercase tracking-[0.3em] mb-2">Dernière étape</p>
          <h1 className="font-serif text-4xl text-neutral-900 font-bold">
            Finaliser la commande
          </h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            onFocus={handleFormFocus}
            className="lg:col-span-3 space-y-8"
            noValidate
          >
            {/* Contact */}
            <fieldset className="space-y-5">
              <legend className="text-xs uppercase tracking-[0.2em] text-neutral-500 pb-4 border-b border-stone-200 w-full">
                Vos coordonnées
              </legend>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Mohammed"
                    className={`input-field ${errors.firstName ? 'border-red-400' : ''}`}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="El Fassi"
                    className={`input-field ${errors.lastName ? 'border-red-400' : ''}`}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                  Téléphone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0612345678"
                  className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                  autoComplete="tel"
                />
                {errors.phone ? (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                ) : (
                  <p className="text-neutral-400 text-xs mt-1">
                    Nous vous contacterons sur ce numéro pour confirmer la livraison.
                  </p>
                )}
              </div>
            </fieldset>

            {/* Delivery */}
            <fieldset className="space-y-5">
              <legend className="text-xs uppercase tracking-[0.2em] text-neutral-500 pb-4 border-b border-stone-200 w-full">
                Adresse de livraison
              </legend>

              <div>
                <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                  Ville *
                </label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={`input-field cursor-pointer ${errors.city ? 'border-red-400' : ''}`}
                >
                  <option value="">Sélectionnez votre ville</option>
                  {MOROCCAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                  Adresse complète *
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="N° rue, quartier, immeuble, appartement..."
                  rows={3}
                  className={`input-field resize-none ${errors.address ? 'border-red-400' : ''}`}
                  autoComplete="street-address"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-600 uppercase tracking-wider mb-2">
                  Instructions de livraison (optionnel)
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Code d'accès, horaire préféré..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>
            </fieldset>

            {/* Payment */}
            <fieldset className="space-y-4">
              <legend className="text-xs uppercase tracking-[0.2em] text-neutral-500 pb-4 border-b border-stone-200 w-full">
                Paiement
              </legend>

              <div className="flex items-start gap-4 p-5 border-2 border-gold bg-gold/5">
                <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-black" />
                </div>
                <div>
                  <p className="text-neutral-900 font-bold text-sm">
                    Paiement à la livraison (COD)
                  </p>
                  <p className="text-neutral-500 text-xs mt-1">
                    Payez en cash directement au livreur. Aucune information
                    bancaire requise.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    name="whatsappConfirm"
                    checked={form.whatsappConfirm}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border transition-colors duration-200 flex items-center justify-center ${
                      form.whatsappConfirm
                        ? 'bg-gold border-gold'
                        : 'border-stone-300'
                    }`}
                  >
                    {form.whatsappConfirm && (
                      <svg
                        className="w-2.5 h-2.5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-neutral-500 text-xs leading-relaxed">
                  Recevoir une confirmation WhatsApp après la commande (recommandé)
                </span>
              </label>
            </fieldset>

            {apiError && (
              <div className="p-4 border border-red-300 bg-red-50 text-red-600 text-sm leading-relaxed">
                <strong className="block mb-1">La commande n&apos;a pas pu être enregistrée</strong>
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-dark w-full text-sm py-5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Enregistrement en cours...'
                : `Confirmer la commande — ${orderTotal.toLocaleString('fr-MA')} MAD`}
            </button>

            <p className="text-center text-neutral-400 text-xs">
              En confirmant, vous acceptez nos conditions générales de vente.
            </p>
          </form>

          {/* Order summary sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-stone-200 shadow-luxury p-6 sticky top-28 space-y-5">
              <h2 className="font-serif text-xl text-neutral-900 border-b border-stone-200 pb-4">
                Votre commande
              </h2>

              {/* Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="relative w-14 h-14 flex-shrink-0 bg-stone-100 overflow-hidden">
                      {imageUrl(item.product.images[0], 112) && (
                        <Image
                          src={imageUrl(item.product.images[0], 112)}
                          alt={item.product.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-900 text-sm font-medium truncate">
                        {item.product.name}
                      </p>
                      <p className="text-neutral-400 text-xs">{item.product.brand}</p>
                    </div>
                    <p className="text-neutral-900 text-sm font-bold flex-shrink-0">
                      {(item.product.price * item.quantity).toLocaleString('fr-MA')} MAD
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Sous-total</span>
                  <span className="text-neutral-900">{total.toLocaleString('fr-MA')} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Livraison</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-neutral-900'}>
                    {shipping === 0
                      ? 'Gratuite'
                      : `${shipping.toLocaleString('fr-MA')} MAD`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-stone-200 items-baseline">
                  <span className="font-bold text-neutral-900">Total</span>
                  <span className="font-serif text-2xl text-gold">
                    {orderTotal.toLocaleString('fr-MA')} MAD
                  </span>
                </div>
                <p className="text-neutral-400 text-xs text-right">
                  Paiement à la livraison
                </p>
              </div>

              {/* Mini trust */}
              <div className="border-t border-stone-200 pt-4 space-y-2">
                {[
                  '✓ Livraison 24–48h',
                  '✓ Paiement sécurisé à la réception',
                  '✓ Support client 7j/7',
                ].map((t) => (
                  <p key={t} className="text-neutral-400 text-xs">
                    {t}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
