import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'À propos de Maison du Prestige | Montres Premium au Maroc',
  description:
    'Découvrez Maison du Prestige, votre boutique de montres originales au Maroc. Fondée par passion pour l\'horlogerie, nous proposons des montres homme et femme authentiques avec livraison gratuite et paiement à la livraison.',
  alternates: { canonical: '/pages/about' },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-950 pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-10">
          <Link href="/" className="hover:text-gold transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-neutral-300">À propos</span>
        </nav>

        {/* Header */}
        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Notre histoire</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white font-bold leading-tight mb-6">
            À propos de Maison du Prestige
          </h1>
          <div className="h-px w-16 bg-gold" />
        </div>

        {/* Body */}
        <div className="space-y-10 text-neutral-300 leading-relaxed text-[15px]">

          <div>
            <h2 className="font-serif text-2xl text-white font-semibold mb-4">Qui sommes-nous ?</h2>
            <p>
              Maison du Prestige est une boutique marocaine spécialisée dans la vente de montres
              premium authentiques. Fondée au Maroc par une équipe passionnée d&apos;horlogerie, notre
              mission est simple : rendre accessible le luxe horloger à tous les Marocains, où qu&apos;ils
              se trouvent dans le Royaume.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-white font-semibold mb-4">Notre passion pour les montres</h2>
            <p>
              Tout a commencé par une conviction : une belle montre est bien plus qu&apos;un simple
              accessoire. C&apos;est un symbole de caractère, un héritage que l&apos;on porte au poignet.
              Depuis notre création, nous sélectionnons avec soin chaque modèle — des chronographes
              sportifs aux montres élégantes habillées — pour constituer une collection qui allie
              style, qualité et durabilité.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-white font-semibold mb-4">Qualité et authenticité garanties</h2>
            <p>
              Chez Maison du Prestige, nous ne faisons aucun compromis sur l&apos;authenticité.
              Chaque montre vendue est{' '}
              <strong className="text-white font-semibold">100 % originale</strong>, livrée dans
              son emballage officiel avec sa garantie constructeur. Nos collections incluent des
              marques reconnues internationalement — Guess, Michael Kors, Emporio Armani, Hugo Boss
              et bien d&apos;autres — sélectionnées pour leur rapport qualité-prix exceptionnel.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-white font-semibold mb-4">Notre engagement envers vous</h2>
            <p>
              Nous savons que commander en ligne demande de la confiance. C&apos;est pourquoi nous avons
              bâti notre service autour de trois piliers :
            </p>
            <ul className="mt-4 space-y-3 pl-4 border-l border-gold/30">
              <li>
                <span className="text-gold font-semibold">Livraison gratuite partout au Maroc</span>
                {' '}— Casablanca, Rabat, Marrakech, Fès, Agadir, Tanger et toutes les autres villes,
                en 2 à 4 jours ouvrables.
              </li>
              <li>
                <span className="text-gold font-semibold">Paiement à la livraison (COD)</span>
                {' '}— Vous recevez votre montre, vous la vérifiez, puis vous payez en espèces.
                Aucune carte bancaire requise, zéro risque pour vous.
              </li>
              <li>
                <span className="text-gold font-semibold">Retours sous 7 jours</span>
                {' '}— Si la montre ne vous convient pas, retournez-la dans son emballage d&apos;origine
                dans les 7 jours suivant la réception. Votre satisfaction est notre priorité.
              </li>
            </ul>
          </div>

          <div>
            <p>
              Maison du Prestige, c&apos;est l&apos;assurance d&apos;une expérience d&apos;achat sereine, du choix
              jusqu&apos;à la livraison. Nous sommes disponibles en français, arabe et darija pour
              répondre à toutes vos questions.
            </p>
          </div>

        </div>

        {/* Trust stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 border-t border-neutral-800 pt-12">
          {[
            { value: '8 000+', label: 'Clients satisfaits' },
            { value: '100 %', label: 'Montres originales' },
            { value: '7j/7',  label: 'Service client' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-serif text-3xl text-gold font-bold">{value}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-[0.18em] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-wrap gap-4">
          <Link href="/collection" className="btn-primary text-sm">
            Découvrir la collection
          </Link>
          <Link href="/" className="btn-ghost text-sm">
            ← Retour à l&apos;accueil
          </Link>
        </div>

      </div>
    </div>
  )
}
