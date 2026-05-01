import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact | Maison du Prestige',
  description:
    'Contactez Maison du Prestige via WhatsApp ou email. Nous répondons sous 24h en français, arabe et darija. Service disponible partout au Maroc.',
  alternates: { canonical: '/pages/contact' },
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '212718743726'
const WA_LINK  = `https://wa.me/${WHATSAPP}`

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-10">
          <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-neutral-300">Contact</span>
        </nav>

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Nous contacter</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white font-bold leading-tight mb-6">
            Contact
          </h1>
          <div className="h-px w-16 bg-gold" />
        </div>

        {/* Contact cards */}
        <div className="space-y-4">

          {/* WhatsApp */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-5 p-6 border border-neutral-800 hover:border-gold/40 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all duration-300 group"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-full border border-neutral-700 group-hover:border-gold/50 flex items-center justify-center transition-colors duration-300">
              <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.528 5.845L.057 23.272a.75.75 0 00.916.916l5.427-1.471A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 01-4.953-1.355l-.355-.212-3.682.998.977-3.562-.232-.368A9.718 9.718 0 012.25 12C2.25 6.616 6.616 2.25 12 2.25S21.75 6.616 21.75 12 17.384 21.75 12 21.75z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">WhatsApp</p>
              <p className="text-white font-medium">+{WHATSAPP.replace(/(\d{3})(\d{3})(\d{6})/, '$1 $2 $3')}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Réponse en moins de 2h</p>
            </div>
            <svg className="w-4 h-4 text-neutral-600 group-hover:text-gold transition-colors duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          {/* Email */}
          <a
            href="mailto:contact@maisonduprestige.com"
            className="flex items-center gap-5 p-6 border border-neutral-800 hover:border-gold/40 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all duration-300 group"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-full border border-neutral-700 group-hover:border-gold/50 flex items-center justify-center transition-colors duration-300">
              <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">Email</p>
              <p className="text-white font-medium">contact@maisonduprestige.com</p>
              <p className="text-xs text-neutral-500 mt-0.5">Réponse sous 24h</p>
            </div>
            <svg className="w-4 h-4 text-neutral-600 group-hover:text-gold transition-colors duration-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

        </div>

        {/* Info grid */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px bg-neutral-800">
          {[
            { label: 'Zone de service', value: 'Tout le Maroc' },
            { label: 'Langues',         value: 'Français · Arabe · Darija' },
            { label: 'Disponibilité',   value: '7j/7 — 9h à 21h' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-neutral-950 px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500 mb-1.5">{label}</p>
              <p className="text-sm text-neutral-200">{value}</p>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-14 pt-8 border-t border-neutral-800 flex flex-wrap gap-4">
          <Link href="/collection" className="btn-primary text-sm">
            Voir la collection
          </Link>
          <Link href="/" className="btn-ghost text-sm">
            ← Retour à l&apos;accueil
          </Link>
        </div>

      </div>
    </div>
  )
}
