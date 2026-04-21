import { defineField, defineType } from 'sanity'

export const homePageType = defineType({
  name: 'homePage',
  title: "Page d'accueil",
  type: 'document',
  groups: [
    { name: 'hero',        title: 'Hero',               default: true },
    { name: 'trust',       title: 'Barre de confiance' },
    { name: 'featured',    title: 'Produits vedettes' },
    { name: 'categories',  title: 'Collections en avant' },
    { name: 'brand',       title: 'Histoire de la marque' },
    { name: 'testimonials',title: 'Témoignages' },
    { name: 'cta',         title: 'Bannière CTA' },
    { name: 'newsletter',  title: 'Newsletter' },
    { name: 'seo',         title: 'SEO' },
  ],
  fields: [
    // ── Hero ──────────────────────────────────────────────────────────────
    defineField({
      name: 'heroTitle',
      title: 'Titre héro (ligne 1)',
      type: 'string',
      group: 'hero',
      initialValue: 'Portez le Temps',
    }),
    defineField({
      name: 'heroTitleAccent',
      title: 'Titre héro (ligne 2 — en doré)',
      type: 'string',
      group: 'hero',
      initialValue: 'avec Intention',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Sous-titre',
      type: 'text',
      rows: 2,
      group: 'hero',
    }),
    defineField({
      name: 'heroImage',
      title: 'Image de fond',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaPrimary',
      title: 'CTA principal (texte)',
      type: 'string',
      group: 'hero',
      initialValue: 'Voir la Collection',
    }),
    defineField({
      name: 'heroCtaSecondary',
      title: 'CTA secondaire (texte)',
      type: 'string',
      group: 'hero',
      initialValue: 'Nos Bestsellers',
    }),
    defineField({
      name: 'heroTrustSignals',
      title: 'Signaux de confiance (sous les CTA)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'hero',
      options: { layout: 'tags' },
      initialValue: ['🚚 Livraison Gratuite', '💳 Paiement à la Livraison', '↩ Retours 7 Jours'],
    }),

    // ── Trust bar ─────────────────────────────────────────────────────────
    defineField({
      name: 'trustItems',
      title: 'Éléments de confiance',
      type: 'array',
      of: [{ type: 'trustItem' }],
      group: 'trust',
    }),

    // ── Featured products ─────────────────────────────────────────────────
    defineField({
      name: 'featuredSectionSubtitle',
      title: 'Sous-titre section vedettes',
      type: 'string',
      group: 'featured',
      initialValue: 'Nos coups de cœur',
    }),
    defineField({
      name: 'featuredSectionTitle',
      title: 'Titre section vedettes',
      type: 'string',
      group: 'featured',
      initialValue: 'Bestsellers',
    }),
    defineField({
      name: 'featuredProducts',
      title: 'Produits vedettes',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      group: 'featured',
      validation: (R) => R.max(8),
      description: '4 produits recommandés.',
    }),

    // ── Categories ────────────────────────────────────────────────────────
    defineField({
      name: 'categoriesSubtitle',
      title: 'Sous-titre section collections',
      type: 'string',
      group: 'categories',
      initialValue: 'Trouvez votre style',
    }),
    defineField({
      name: 'categoriesTitle',
      title: 'Titre section collections',
      type: 'string',
      group: 'categories',
      initialValue: 'Par Univers',
    }),
    defineField({
      name: 'featuredCollections',
      title: 'Collections mises en avant',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'collection' }] }],
      group: 'categories',
      validation: (R) => R.max(4),
    }),

    // ── Brand story ───────────────────────────────────────────────────────
    defineField({
      name: 'brandSubtitle',
      title: 'Sous-titre histoire',
      type: 'string',
      group: 'brand',
      initialValue: 'Notre histoire',
    }),
    defineField({
      name: 'brandTitle',
      title: 'Titre histoire (ligne 1 & 2)',
      type: 'string',
      group: 'brand',
      initialValue: "L'Horlogerie au service du",
    }),
    defineField({
      name: 'brandTitleAccent',
      title: 'Titre histoire (ligne 3 — en doré)',
      type: 'string',
      group: 'brand',
      initialValue: 'Maroc Moderne',
    }),
    defineField({
      name: 'brandText1',
      title: 'Paragraphe 1',
      type: 'text',
      rows: 3,
      group: 'brand',
    }),
    defineField({
      name: 'brandText2',
      title: 'Paragraphe 2',
      type: 'text',
      rows: 3,
      group: 'brand',
    }),
    defineField({
      name: 'brandImage',
      title: 'Image de la marque',
      type: 'image',
      options: { hotspot: true },
      group: 'brand',
    }),
    defineField({
      name: 'brandYear',
      title: 'Année de fondation',
      type: 'string',
      group: 'brand',
      initialValue: '2019',
    }),
    defineField({
      name: 'brandFoundedLabel',
      title: 'Label sous l\'année',
      type: 'string',
      group: 'brand',
      initialValue: 'Fondé au Maroc',
    }),
    defineField({
      name: 'brandStats',
      title: 'Statistiques',
      type: 'array',
      of: [{ type: 'stat' }],
      group: 'brand',
    }),

    // ── Testimonials ──────────────────────────────────────────────────────
    defineField({
      name: 'testimonialsSubtitle',
      title: 'Sous-titre témoignages',
      type: 'string',
      group: 'testimonials',
      initialValue: 'Ils nous font confiance',
    }),
    defineField({
      name: 'testimonialsTitle',
      title: 'Titre témoignages',
      type: 'string',
      group: 'testimonials',
      initialValue: 'Avis Clients',
    }),
    defineField({
      name: 'testimonials',
      title: 'Témoignages',
      type: 'array',
      of: [{ type: 'testimonial' }],
      group: 'testimonials',
    }),

    // ── CTA banner ────────────────────────────────────────────────────────
    defineField({
      name: 'ctaLabel',
      title: 'Label CTA (petite ligne)',
      type: 'string',
      group: 'cta',
      initialValue: 'Offre limitée',
    }),
    defineField({
      name: 'ctaTitle',
      title: 'Titre CTA (avant le chiffre)',
      type: 'string',
      group: 'cta',
      initialValue: "Jusqu'à",
    }),
    defineField({
      name: 'ctaDiscount',
      title: 'Remise mise en avant',
      type: 'string',
      group: 'cta',
      initialValue: '−25%',
    }),
    defineField({
      name: 'ctaSubtitle',
      title: 'Sous-titre CTA',
      type: 'string',
      group: 'cta',
    }),
    defineField({
      name: 'ctaButton',
      title: 'Texte du bouton CTA',
      type: 'string',
      group: 'cta',
      initialValue: "Profiter de l'offre maintenant",
    }),
    defineField({
      name: 'ctaImage',
      title: 'Image de fond CTA',
      type: 'image',
      options: { hotspot: true },
      group: 'cta',
    }),

    // ── Newsletter ────────────────────────────────────────────────────────
    defineField({
      name: 'newsletterSubtitle',
      title: 'Sous-titre newsletter',
      type: 'string',
      group: 'newsletter',
      initialValue: 'Restez informé',
    }),
    defineField({
      name: 'newsletterTitle',
      title: 'Titre newsletter',
      type: 'string',
      group: 'newsletter',
      initialValue: 'Accès VIP en Avant-Première',
    }),
    defineField({
      name: 'newsletterText',
      title: 'Texte newsletter',
      type: 'string',
      group: 'newsletter',
    }),

    // ── SEO ───────────────────────────────────────────────────────────────
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    prepare() { return { title: "Page d'accueil" } },
  },
})
