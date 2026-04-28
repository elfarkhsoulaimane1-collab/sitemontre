'use client'

import { useState, useEffect, useRef, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PortableText } from '@portabletext/react'
import { Product, Review, RichDescriptionBlock, RichDescriptionImageBlock } from '@/types'
import { trackPurchase, trackViewContent, trackInitiateCheckout } from '@/lib/tracking'
import { imageUrl } from '@/sanity/lib/image'
import ProductImageWatermark from '@/components/ProductImageWatermark'

const RelatedCard    = dynamic(() => import('./RelatedCard'),    { ssr: false })
const ReviewsSection = dynamic(() => import('./ReviewsSection'), { ssr: false })

interface Props {
  product:         Product
  related:         Product[]
  reviews:         Review[]
  whatsappNumber?: string
  sanityEnabled?:  boolean
}

interface OrderFormValues {
  firstName: string
  lastName:  string
  phone:     string
  city:      string
  address:   string
}

interface SuccessData extends OrderFormValues {
  orderRef: string
}

const EMPTY: OrderFormValues = { firstName: '', lastName: '', phone: '', city: '', address: '' }

// Moroccan mobile number — three explicit branches, ASCII-only [0-9] (not \d which
// matches Unicode digits and could bypass the check with e.g. Arabic-Indic numerals).
//
// Branch 1  +?212[67][0-9]{8}  +212612345678  ✓   212712345678    ✓
// Branch 2  0[67][0-9]{8}      0612345678     ✓   0712345678      ✓
// Branch 3  [67][0-9]{8}       612345678      ✓   712345678       ✓
// Too long  0[67][0-9]{8}      067123456789   ✗   06123456789     ✗
// Bad prefix                   0812345678     ✗   +33612345678    ✗
const PHONE_RE = /^(?:\+?212[67][0-9]{8}|0[67][0-9]{8}|[67][0-9]{8})$/

const SIZE_CLASS: Record<string, string> = {
  small:  'max-w-xs',
  medium: 'max-w-md',
  large:  'max-w-2xl',
  full:   'w-full',
}
const ALIGN_CLASS: Record<string, string> = {
  left:   'mr-auto',
  center: 'mx-auto',
  right:  'ml-auto',
}

function RichDescription({ blocks }: { blocks: RichDescriptionBlock[] }) {
  return (
    <div className="space-y-4">
      <PortableText
        value={blocks}
        components={{
          block: {
            normal: ({ children }) => (
              <p className="text-neutral-400 text-[14px] leading-[1.9]">{children}</p>
            ),
            h2: ({ children }) => (
              <h2 className="font-serif text-xl text-white font-bold mt-6 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="font-serif text-base text-white font-semibold mt-5 mb-1">{children}</h3>
            ),
          },
          types: {
            imageBlock: ({ value }: { value: RichDescriptionImageBlock }) => {
              const url = value.asset?.url
              if (!url) return null
              const sizeClass  = SIZE_CLASS[value.size  ?? 'medium'] ?? SIZE_CLASS.medium
              const alignClass = ALIGN_CLASS[value.alignment ?? 'center'] ?? ALIGN_CLASS.center
              return (
                <div className={`my-6 ${sizeClass} ${alignClass}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={value.alt ?? ''} className="w-full object-cover" />
                </div>
              )
            },
          },
        }}
      />
    </div>
  )
}

function seedFrom(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

const ViewersBadge = memo(function ViewersBadge({ seed }: { seed: string }) {
  const [viewers, setViewers] = useState(() => (seedFrom(seed + 'v') % 8) + 6)
  useEffect(() => {
    const t = setInterval(
      () => setViewers(v => Math.max(4, Math.min(20, v + (Math.random() > 0.5 ? 1 : -1)))),
      8000,
    )
    return () => clearInterval(t)
  }, [])
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[11px] text-neutral-200">
      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      <span><strong className="text-white font-bold">{viewers}</strong> personnes regardent</span>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════════════════
   ORDER FORM — isolated so keystrokes only re-render this component
═══════════════════════════════════════════════════════════════════════════ */
function OrderForm({ product, formRef, onSuccess }: {
  product:   Product
  formRef:   React.RefObject<HTMLDivElement>
  onSuccess: (data: SuccessData) => void
}) {
  const [form,       setForm]       = useState<OrderFormValues>(EMPTY)
  const [errors,     setErrors]     = useState<Partial<OrderFormValues>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState('')
  const [orderRef]                  = useState(() => `ATL-${Date.now().toString(36).toUpperCase()}`)

  const checkoutFired  = useRef(false)
  const submittingRef  = useRef(false)

  function handleFormFocus() {
    if (checkoutFired.current) return
    checkoutFired.current = true
    trackInitiateCheckout({ productId: product.id, productName: product.name, value: product.price })
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    setErrors(p => ({ ...p, [name]: undefined }))
  }

  function validate() {
    const e: Partial<OrderFormValues> = {}
    if (!form.firstName.trim()) e.firstName = 'Requis'
    if (!form.lastName.trim())  e.lastName  = 'Requis'
    if (!form.phone.trim()) {
      e.phone = 'Requis'
    } else if (!PHONE_RE.test(form.phone.replace(/[\s\-]/g, ''))) {
      e.phone = 'Format invalide (ex: 0612345678 ou 612345678)'
    }
    if (!form.city.trim())    e.city    = 'Requis'
    if (!form.address.trim()) e.address = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current) return
    if (!validate()) return

    const shipping = product.price >= 500 ? 0 : 50
    const total    = product.price + shipping

    submittingRef.current = true
    setSubmitting(true)
    setApiError('')

    let saved = false
    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderRef,
          firstName: form.firstName,
          lastName:  form.lastName,
          phone:     form.phone,
          city:      form.city,
          address:   form.address,
          notes:     '',
          items: [{ productName: product.name, quantity: 1, unitPrice: product.price, totalPrice: product.price }],
          subtotal: product.price,
          shipping,
          total,
        }),
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
      if (!saved) submittingRef.current = false
      setSubmitting(false)
    }

    if (saved) {
      trackPurchase({ orderId: orderRef, productId: product.id, productName: product.name, value: product.price })
      onSuccess({ ...form, orderRef })
    }
  }

  return (
    <>
      <p className="text-neutral-500 text-[11px] uppercase tracking-[0.2em] text-center mb-3">
        Remplissez ce formulaire pour confirmer votre commande rapidement
      </p>

      <div ref={formRef} className="overflow-hidden border border-neutral-700 w-full">

        {/* Form header */}
        <div className="bg-neutral-900 px-4 sm:px-6 py-5 border-b border-neutral-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl text-white font-bold leading-tight">
              Commander maintenant
            </h2>
            <p className="text-neutral-500 text-xs mt-1">
              Payez <span className="text-emerald-400 font-semibold">cash à la réception</span> · Sans carte bancaire
            </p>
          </div>
          <div className="flex-shrink-0 text-center">
            <span className="block text-[9px] font-black uppercase tracking-[0.3em] bg-gold text-black px-3 py-1.5">COD</span>
            <span className="block text-[8px] text-neutral-600 mt-1">Sans carte</span>
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} onFocus={handleFormFocus} noValidate className="bg-[#0d0d0d] p-4 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Prénom" error={errors.firstName}>
              <input type="text" name="firstName" value={form.firstName} onChange={handleChange}
                placeholder="Mohammed" autoComplete="given-name"
                className={`w-full min-w-0 bg-neutral-900 border text-neutral-100 placeholder-neutral-600 px-4 py-4 text-sm focus:outline-none focus:border-amber-400 focus:bg-neutral-800 transition-colors duration-150 ${
                  errors.firstName ? 'border-red-500' : 'border-neutral-700 hover:border-neutral-500'
                }`}
              />
            </Field>
            <Field label="Nom" error={errors.lastName}>
              <input type="text" name="lastName" value={form.lastName} onChange={handleChange}
                placeholder="El Fassi" autoComplete="family-name"
                className={`w-full min-w-0 bg-neutral-900 border text-neutral-100 placeholder-neutral-600 px-4 py-4 text-sm focus:outline-none focus:border-amber-400 focus:bg-neutral-800 transition-colors duration-150 ${
                  errors.lastName ? 'border-red-500' : 'border-neutral-700 hover:border-neutral-500'
                }`}
              />
            </Field>
          </div>

          <Field label="Téléphone WhatsApp" error={errors.phone} hint="Nous vous appelons pour confirmer la livraison">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none select-none">+212</span>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                placeholder="06 12 34 56 78" autoComplete="tel"
                className={`w-full bg-neutral-900 border text-neutral-100 placeholder-neutral-600 pl-[3.75rem] pr-4 py-4 text-sm focus:outline-none focus:border-amber-400 focus:bg-neutral-800 transition-colors duration-150 ${
                  errors.phone ? 'border-red-500' : 'border-neutral-700 hover:border-neutral-500'
                }`}
              />
            </div>
          </Field>

          <Field label="Ville" error={errors.city}>
            <input type="text" name="city" value={form.city} onChange={handleChange}
              placeholder="Casablanca, Rabat, Marrakech…" autoComplete="address-level2"
              className={`w-full bg-neutral-900 border text-neutral-100 placeholder-neutral-600 px-4 py-4 text-sm focus:outline-none focus:border-amber-400 focus:bg-neutral-800 transition-colors duration-150 ${
                errors.city ? 'border-red-500' : 'border-neutral-700 hover:border-neutral-500'
              }`}
            />
          </Field>

          <Field label="Adresse de livraison" error={errors.address} hint="Rue, quartier, immeuble, numéro d'appartement">
            <textarea name="address" value={form.address} onChange={handleChange}
              placeholder="Ex : 12 Rue Ibn Battouta, Appt 3, Maarif"
              rows={3} autoComplete="street-address"
              className={`w-full bg-neutral-900 border text-neutral-100 placeholder-neutral-600 px-4 py-4 text-sm focus:outline-none focus:border-amber-400 focus:bg-neutral-800 transition-colors duration-150 resize-none ${
                errors.address ? 'border-red-500' : 'border-neutral-700 hover:border-neutral-500'
              }`}
            />
          </Field>

          {apiError && (
            <div className="p-3.5 border border-red-500/30 bg-red-950/40 text-red-400 text-xs leading-relaxed">
              <strong className="block mb-0.5 text-red-300">Commande non enregistrée</strong>
              {apiError}
            </div>
          )}

          {/* ── MAIN CTA ──────────────────────────────────────────── */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-8 font-black text-lg uppercase tracking-[0.1em] transition-all duration-200 flex flex-col items-center justify-center gap-1.5 ${
                submitting
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-amber-400 text-black hover:bg-amber-300 active:scale-[0.99] shadow-[0_8px_40px_rgba(251,191,36,0.45)]'
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Spinner /> Traitement en cours…</span>
              ) : (
                <>
                  <span className="flex items-center gap-2.5 text-[17px]">
                    <LockIcon className="w-4 h-4" />
                    Commander maintenant
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-normal normal-case tracking-normal opacity-65">
                    Paiement à la livraison · {product.price.toLocaleString('fr-MA')} MAD
                  </span>
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </>
  )
}

const MOCK_REVIEWS: Review[] = [
  { _id: 'm1', name: 'Karim B.',   rating: 5, comment: "Montre absolument magnifique. La qualité est au rendez-vous, livraison rapide et le paiement à la réception m'a mis en confiance. Je recommande à 100%.", _createdAt: '2025-03-15' },
  { _id: 'm2', name: 'Fatima Z.',  rating: 5, comment: "Commandé pour offrir à mon mari. Il est ravi ! L'emballage est premium, la montre est identique aux photos. Service impeccable.", _createdAt: '2025-02-28' },
  { _id: 'm3', name: 'Youssef M.', rating: 4, comment: "Très belle montre, rapport qualité-prix excellent. Le livreur était ponctuel et très professionnel. Je reviendrai commander.", _createdAt: '2025-04-02' },
]

/* ════════════════════════════════════════════════════════════════════════════ */
export default function ProductDetailClient({
  reviews,
  product,
  related,
  whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '212600000000',
  sanityEnabled  = false,
}: Props) {
  const [activeImg, setActiveImg] = useState(0)
  const [imgError,  setImgError]  = useState<Record<number, boolean>>({})
  const [success,   setSuccess]   = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  useEffect(() => {
    trackViewContent({ productId: product.id, productName: product.name, value: product.price })
  }, [product.id, product.name, product.price])

  const stockLeft = (seedFrom(product.id) % 5) + 3

  const formRef = useRef<HTMLDivElement>(null)
  const [stickyBar, setStickyBar] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setStickyBar(!e.isIntersecting), { threshold: 0 })
    if (formRef.current) obs.observe(formRef.current)
    return () => obs.disconnect()
  }, [])

  function handleOrderSuccess(data: SuccessData) {
    setSuccessData(data)
    setSuccess(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const mainImg = imageUrl(product.images?.[activeImg], 900)

  const waDirect = encodeURIComponent(
    `Bonjour Maison du Prestige 👋\nJe souhaite commander :\n• ${product.name} — ${product.price.toLocaleString('fr-MA')} MAD\n\nMerci de me confirmer la dispo.`
  )

  /* ── SUCCESS SCREEN ───────────────────────────────────────────────────────── */
  if (success && successData) {
    const s = successData
    const waConfirm = encodeURIComponent(
      `Bonjour Maison du Prestige 👋\nNouv. commande !\n\nRéf: ${s.orderRef}\n• ${product.name} — ${product.price.toLocaleString('fr-MA')} MAD\n\nClient: ${s.firstName} ${s.lastName}\nTél: ${s.phone}\nVille: ${s.city}\nAdresse: ${s.address}\n\nPaiement: cash à la livraison`
    )
    return (
      <div className="min-h-screen bg-neutral-950 px-4 py-16 sm:py-24">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <div className="w-20 h-20 border border-gold/40 flex items-center justify-center mx-auto mb-8 bg-gold/5">
              <svg className="w-9 h-9 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4">Commande confirmée</p>
            <h1 className="font-serif text-4xl text-white font-bold mb-3">
              Merci, {s.firstName}&nbsp;!
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Votre commande <span className="text-gold font-bold">{s.orderRef}</span> a bien été enregistrée.
            </p>
          </div>

          <div className="border border-neutral-800 mb-5">
            <div className="flex gap-4 p-5 border-b border-neutral-800">
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden bg-neutral-900">
                {imageUrl(product.images?.[0], 128)
                  ? <Image src={imageUrl(product.images?.[0], 128) as string} alt={product.name} fill unoptimized className="object-cover" sizes="64px" />
                  : <span className="w-full h-full bg-neutral-800 block" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-600 text-[10px] uppercase tracking-widest">{product.brand}</p>
                <p className="text-white font-bold text-sm truncate">{product.name}</p>
                <p className="text-gold font-serif text-lg mt-0.5">{product.price.toLocaleString('fr-MA')} MAD</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Client',    value: `${s.firstName} ${s.lastName}` },
                { label: 'Téléphone', value: s.phone },
                { label: 'Ville',     value: s.city },
                { label: 'Adresse',   value: s.address },
                { label: 'Paiement',  value: 'Cash à la livraison (COD)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-neutral-600 flex-shrink-0">{label}</span>
                  <span className="text-neutral-300 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-5 py-4 border-t border-neutral-800 items-baseline bg-neutral-900">
              <span className="text-white font-bold text-sm">Total à payer</span>
              <span className="font-serif text-2xl text-gold">{product.price.toLocaleString('fr-MA')} MAD</span>
            </div>
          </div>

          <div className="border border-neutral-800 p-6 mb-5 space-y-5">
            <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold">Prochaines étapes</p>
            {[
              { n: '1', cls: 'bg-gold text-black',        title: 'Appel de confirmation',  desc: 'Notre équipe vous appellera dans les 2 heures pour valider votre commande.' },
              { n: '2', cls: 'bg-blue-600 text-white',    title: 'Expédition',             desc: 'Votre montre est préparée et expédiée dès confirmation.' },
              { n: '3', cls: 'bg-emerald-600 text-white', title: 'Livraison à domicile',   desc: 'Partout au Maroc en 2–4 jours ouvrables. Vous payez à la réception.' },
            ].map(({ n, cls, title, desc }) => (
              <div key={n} className="flex gap-4">
                <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${cls}`}>{n}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-neutral-500 text-xs leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-[#25D366]/25 bg-[#25D366]/5 p-5 mb-6">
            <p className="text-white text-sm font-semibold mb-1">Suivez votre commande sur WhatsApp</p>
            <p className="text-neutral-500 text-xs leading-relaxed mb-4">Envoyez votre référence pour recevoir des mises à jour en temps réel.</p>
            <a href={`https://wa.me/${whatsappNumber}?text=${waConfirm}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#25D366] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#1ebe5b] transition-colors">
              <WhatsAppIcon /> Envoyer la confirmation
            </a>
          </div>

          <div className="text-center">
            <Link href="/collection" className="text-neutral-600 text-xs uppercase tracking-widest hover:text-gold transition-colors">
              Continuer mes achats →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const displayReviews = reviews.length > 0 ? reviews : MOCK_REVIEWS
  const isMockReviews  = reviews.length === 0

  /* ── MAIN PAGE ────────────────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="bg-neutral-950 border-b border-neutral-800/60 px-4 sm:px-6 lg:px-8 py-3.5">
        <nav className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] text-neutral-500">
          <Link href="/"           className="hover:text-gold transition-colors duration-200">Accueil</Link>
          <ChevronRight />
          <Link href="/collection" className="hover:text-gold transition-colors duration-200">Collection</Link>
          <ChevronRight />
          <span className="text-neutral-300 truncate max-w-[180px] sm:max-w-none">{product.name}</span>
        </nav>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          § 1  HERO — Gallery + Product Info
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 lg:py-18">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-16 xl:gap-24">

            {/* ── GALLERY ───────────────────────────────────────────────────── */}
            <div className="md:sticky md:top-6 md:self-start w-full overflow-hidden">

              {/* Main image */}
              <div className="relative aspect-[4/5] bg-neutral-900 overflow-hidden">
                {!imgError[activeImg] && mainImg ? (
                  <Image
                    src={mainImg}
                    alt={`${product.name} — vue ${activeImg + 1}`}
                    fill priority unoptimized
                    className="object-cover transition-opacity duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={() => setImgError(p => ({ ...p, [activeImg]: true }))}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <WatchIcon />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-0 left-0 z-10">
                    <span className={`block text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 ${
                      product.badge === 'Sale'    ? 'bg-red-600 text-white' :
                      product.badge === 'Limited' ? 'bg-neutral-950 text-gold' :
                      product.badge === 'New'     ? 'bg-white text-neutral-950' :
                                                    'bg-gold text-black'
                    }`}>
                      {product.badge}{discount && product.badge === 'Sale' ? ` −${discount}%` : null}
                    </span>
                    {product.badge === 'Limited' && (
                      <span className="block h-[2px] bg-gold w-full" />
                    )}
                  </div>
                )}

                {/* Live viewers */}
                <ViewersBadge seed={product.id} />

                {/* Dot nav */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 z-10 flex gap-1.5">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        aria-label={`Image ${i + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                          activeImg === i ? 'w-6 h-1.5 bg-gold' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <ProductImageWatermark />
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-1.5 mt-1.5 overflow-x-auto max-w-full">
                  {product.images.map((img, i) => {
                    const thumbSrc = imageUrl(img, 200)
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`relative flex-shrink-0 w-[72px] h-[72px] overflow-hidden transition-all duration-200 ${
                          activeImg === i
                            ? 'ring-2 ring-gold ring-offset-2 ring-offset-neutral-950'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        {!imgError[i] && thumbSrc ? (
                          <Image src={thumbSrc} alt={`${product.name} — vue ${i + 1}`} fill unoptimized className="object-cover" sizes="72px"
                            onError={() => setImgError(p => ({ ...p, [i]: true }))} />
                        ) : (
                          <div className="w-full h-full bg-neutral-800" />
                        )}
                        <ProductImageWatermark />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── PRODUCT INFO + FORM ───────────────────────────────────────── */}
            <div className="space-y-6 py-1">

              {/* Brand + name + rating */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-px w-6 bg-gold/60" />
                  <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.5em]">{product.brand}</p>
                </div>
                <h1 className="font-serif text-[2.4rem] sm:text-5xl text-white font-bold leading-[1.0] tracking-[-0.02em] mb-4">
                  {product.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-gold' : 'text-neutral-700'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-neutral-400 text-sm">
                    {product.rating}/5 · <span className="text-neutral-200">{product.reviews} avis</span>
                  </span>
                  {product.badge === 'Bestseller' && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] bg-gold text-black px-2.5 py-1">
                      #1 Bestseller
                    </span>
                  )}
                </div>
              </div>

              {/* ── PRICE — large, dominant, clear hierarchy ───────────────── */}
              <div>
                <div className="h-[2px] bg-gradient-to-r from-gold via-gold/50 to-transparent" />
                <div className="bg-neutral-900 border border-neutral-800 border-t-0 px-4 sm:px-6 py-6 overflow-hidden">
                  {/* Price row */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-[2.5rem] sm:text-[4.5rem] leading-none text-amber-400 font-black tracking-tight">
                        {product.price.toLocaleString('fr-MA')}
                      </span>
                      <span className="text-amber-400/70 text-xl sm:text-2xl font-bold">MAD</span>
                    </div>
                    {product.originalPrice && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-neutral-500 line-through text-base">
                          {product.originalPrice.toLocaleString('fr-MA')} MAD
                        </span>
                        <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 tracking-wide">
                          −{discount}%
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Urgency — stock warning */}
                  <p className={`flex items-center text-[13px] font-semibold mt-2 mb-1 px-3 py-1.5 rounded-md ${stockLeft <= 4 ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 !text-amber-300'}`}>
                    ⚠️ Stock limité — plus que {stockLeft} pièce{stockLeft > 1 ? 's' : ''} disponible{stockLeft > 1 ? 's' : ''}
                  </p>

                  {/* Economy line */}
                  {product.originalPrice && (
                    <p className="flex items-center gap-1.5 text-emerald-300 text-[13px] font-semibold mb-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Économie de {(product.originalPrice - product.price).toLocaleString('fr-MA')} MAD
                    </p>
                  )}
                  {/* COD reassurance */}
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-neutral-300 text-[13px]">
                      Vous payez <span className="text-white font-semibold">à la livraison</span> · Aucun paiement en ligne
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 3 TRUST PILLS — close to price ────────────────────────── */}
              <div className="grid grid-cols-3 gap-px bg-neutral-800">
                {[
                  { icon: <CodIcon className="w-5 h-5" />,         label: 'Vérifier et payer\nà la livraison' },
                  { icon: <ShieldIcon className="w-5 h-5" />,     label: 'Garantie\n2 ans' },
                  { icon: <TruckIcon className="w-5 h-5" />,      label: 'Livraison gratuite\net paiement à la réception' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 py-4 px-2 bg-neutral-900 text-center">
                    <span className="text-gold">{icon}</span>
                    <p className="text-neutral-200 text-[10px] font-semibold leading-tight whitespace-pre-line">{label}</p>
                  </div>
                ))}
              </div>

              {/* Short description */}
              <p className="text-[15px] text-neutral-400 leading-[1.85]">{product.description}</p>

              {/* Stock urgency */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-400 font-medium uppercase tracking-widest">Disponibilité</span>
                  <span className={`font-semibold ${stockLeft <= 4 ? 'text-red-300' : 'text-emerald-300'}`}>
                    {stockLeft <= 4 ? `⚠ Plus que ${stockLeft} en stock` : `${stockLeft} pièces disponibles`}
                  </span>
                </div>
                <div className="h-[4px] bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${stockLeft <= 4 ? 'bg-red-500' : 'bg-gold'}`}
                    style={{ width: `${(stockLeft / 10) * 100}%` }}
                  />
                </div>
                <p className="flex items-center gap-2 text-sm text-neutral-400">
                  <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Commandez maintenant —{' '}
                  <span className="text-white font-semibold">livraison sous 2–4 jours</span>
                </p>
              </div>

              {/* ── ORDER FORM ────────────────────────────────────────────── */}
              <OrderForm product={product} formRef={formRef} onSuccess={handleOrderSuccess} />

              {/* WhatsApp alt */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-neutral-950 px-4 text-neutral-600 text-[10px] uppercase tracking-widest">ou commandez par</span>
                </div>
              </div>

              <a
                href={`https://wa.me/${whatsappNumber}?text=${waDirect}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full py-4 font-bold text-sm uppercase tracking-[0.12em] bg-[#25D366] text-white hover:bg-[#1ebe5b] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <WhatsAppIcon /> Commander sur WhatsApp
              </a>

              {/* Features */}
              {product.features?.length > 0 && (
                <div className="pt-1 border-t border-neutral-800">
                  <h3 className="text-[10px] uppercase tracking-[0.35em] text-neutral-500 mb-5 pt-5 flex items-center gap-4">
                    <span>Caractéristiques</span>
                    <span className="flex-1 h-px bg-neutral-800" />
                  </h3>
                  <ul className="space-y-3">
                    {product.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-[14px] text-neutral-400">
                        <span className="text-gold mt-1 flex-shrink-0 text-[8px]">◆</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long description — richDescription takes priority, falls back to plain text */}
              {(product.richDescription?.length || product.longDescription) && (
                <div className="pt-1 border-t border-neutral-800">
                  <h3 className="text-[10px] uppercase tracking-[0.35em] text-neutral-500 mb-4 pt-5">Description</h3>
                  {product.richDescription?.length
                    ? <RichDescription blocks={product.richDescription} />
                    : <p className="text-neutral-400 text-[14px] leading-[1.9]">{product.longDescription}</p>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          § 2  BENEFITS BAR
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-900 border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-neutral-800">
            {[
              { icon: <AwardIcon />,                        title: 'Qualité certifiée',       sub: 'Chaque pièce inspectée avant envoi' },
              { icon: <CodIcon className="w-5 h-5" />,     title: 'Vérifier et payer à la livraison', sub: 'Paiement uniquement après vérification' },
              { icon: <TruckIcon className="w-5 h-5" />,   title: 'Garantie 2 ans',     sub: 'Produit original avec garantie' },
              { icon: <ReturnIcon className="w-5 h-5" />,  title: 'Livraison gratuite et paiement à la réception',         sub: 'Sans frais supplémentaires' },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3 px-4 sm:px-6 py-6 sm:py-8">
                <div className="w-10 h-10 border border-gold/20 bg-gold/5 flex items-center justify-center flex-shrink-0 text-gold">
                  {icon}
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-tight">{title}</p>
                  <p className="text-neutral-500 text-[11px] mt-1 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          § 3  TRUST SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-950 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.5em] text-gold/70 mb-3">Nos garanties</p>
            <h2 className="font-serif text-3xl text-white font-bold leading-tight tracking-[-0.02em]">
              Achetez en toute confiance
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-800 mb-px">
            {[
              {
                icon: <ShieldIcon className="w-5 h-5" />,
                iconCls: 'text-gold bg-gold/8 border-gold/20',
                title: '100% Authentique',
                desc: 'Chaque montre est vérifiée avant expédition. Remboursé si non conforme.',
              },
              {
                icon: <CodIcon className="w-5 h-5" />,
                iconCls: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/20',
                title: 'Paiement à la livraison',
                desc: 'Aucune carte requise. Payez uniquement en cash à la réception.',
              },
              {
                icon: <TruckIcon className="w-5 h-5" />,
                iconCls: 'text-sky-400 bg-sky-400/8 border-sky-400/20',
                title: 'Livraison partout',
                desc: 'Partout au Maroc en 2–4 jours. Port offert dès 500 MAD.',
              },
              {
                icon: <WhatsAppIconSm />,
                iconCls: 'text-[#25D366] bg-[#25D366]/8 border-[#25D366]/20',
                title: 'Support WhatsApp',
                desc: "Réponse en moins d'une heure, 7j/7, directement sur WhatsApp.",
              },
            ].map(({ icon, iconCls, title, desc }) => (
              <div key={title} className="bg-neutral-900 p-7">
                <div className={`w-11 h-11 border flex items-center justify-center mb-5 ${iconCls}`}>
                  {icon}
                </div>
                <p className="text-white font-bold text-[13px] mb-2">{title}</p>
                <p className="text-neutral-500 text-[12px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center gap-5 justify-between px-4 sm:px-7 py-6">
            <div>
              <p className="text-white font-semibold">Une question avant de commander ?</p>
              <p className="text-neutral-400 text-sm mt-0.5">Notre équipe vous répond rapidement et vous aide à choisir en toute confiance.</p>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${waDirect}`}
              target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#25D366] text-white font-bold text-[11px] uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-[#1ebe5b] transition-colors"
            >
              <WhatsAppIcon /> Contacter sur WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          § 4  REVIEWS
      ════════════════════════════════════════════════════════════════════════ */}
      <ReviewsSection
        reviews={displayReviews}
        productRating={product.rating}
        productReviewCount={product.reviews}
        productId={product.id}
        canSubmit={sanityEnabled}
        isMock={isMockReviews}
      />

      {/* ════════════════════════════════════════════════════════════════════════
          § 5  RELATED PRODUCTS
      ════════════════════════════════════════════════════════════════════════ */}
      {related.length > 0 && (
        <div className="bg-neutral-950 py-20 lg:py-28 border-t border-neutral-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12 gap-6">
              <div>
                <p className="text-[9px] uppercase tracking-[0.55em] text-gold/60 mb-3">Vous aimerez aussi</p>
                <h2 className="font-serif text-3xl font-bold text-white leading-none tracking-[-0.025em]">
                  Montres similaires
                </h2>
              </div>
              <Link href="/collection"
                className="group flex-shrink-0 flex items-center gap-3 text-neutral-500 text-[10px] uppercase tracking-[0.4em] hover:text-gold transition-colors pb-1">
                Tout voir
                <span className="block w-5 h-px bg-neutral-700 group-hover:bg-gold group-hover:w-8 transition-all duration-500" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[1px] bg-neutral-800">
              {related.map(p => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky CTA bar ────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        stickyBar ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {stockLeft <= 4 && (
          <div className="bg-red-600 text-white text-center text-[10px] font-bold uppercase tracking-widest py-1.5">
            ⚠ Plus que {stockLeft} en stock
          </div>
        )}
        <div className="bg-neutral-950 border-t border-neutral-800 px-4 pt-3 pb-6 grid grid-cols-[1fr_auto_auto] gap-3 items-stretch">
          {/* Price info */}
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider truncate">{product.brand}</p>
            <p className="text-amber-400 font-serif font-black text-xl leading-tight">{product.price.toLocaleString('fr-MA')} <span className="text-sm text-amber-400/70">MAD</span></p>
            {product.originalPrice && (
              <p className="text-neutral-600 line-through text-[11px]">{product.originalPrice.toLocaleString('fr-MA')} MAD</p>
            )}
          </div>
          {/* Primary CTA */}
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="flex-shrink-0 flex flex-col items-center justify-center px-5 bg-amber-400 text-black font-black text-[11px] uppercase tracking-wide hover:bg-amber-300 active:scale-[0.97] transition-all leading-tight py-2"
          >
            <span>Commander maintenant</span>
            <span className="font-normal normal-case tracking-normal text-[9px] opacity-60">Paiement à la livraison</span>
          </button>
          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${waDirect}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 w-12 flex items-center justify-center bg-[#25D366] text-white hover:bg-[#1ebe5b] transition-colors"
            aria-label="Commander sur WhatsApp"
          >
            <WhatsAppIcon />
          </a>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
function Field({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5 min-w-0">
      <label className="block text-xs font-semibold text-neutral-300 tracking-wide">{label}</label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-red-400 text-xs">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="text-neutral-500 text-[11px]">{hint}</p>
      ) : null}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════════════ */
function ChevronRight() {
  return (
    <svg className="w-3 h-3 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function WatchIcon() {
  return (
    <svg className="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
      <circle cx="12" cy="12" r="7" /><path d="M12 9v3l2 2M9 3h6M9 21h6" strokeLinecap="round" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function WhatsAppIconSm() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function LockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function TruckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 0M13 16l-2 0M13 16h2M13 6h5l3 4v5l-3 1" />
    </svg>
  )
}

function CodIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

function ShieldIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function ReturnIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )
}

function CheckCircleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function AwardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  )
}
