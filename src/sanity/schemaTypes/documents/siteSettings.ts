import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Paramètres du site',
  type: 'document',
  // Singleton — one document only
  groups: [
    { name: 'brand',        title: 'Marque & Logo',        default: true },
    { name: 'nav',          title: 'Navigation'           },
    { name: 'footer',       title: 'Pied de page'         },
    { name: 'trust',        title: 'Badges de confiance'  },
    { name: 'contact',      title: 'Contact & Réseaux'    },
    { name: 'tracking',     title: 'Tracking & Pixels'    },
    { name: 'integrations', title: 'Intégrations'         },
  ],
  fields: [
    // Brand
    defineField({
      name: 'siteName',
      title: 'Nom du site',
      type: 'string',
      group: 'brand',
      initialValue: 'Maison du Prestige',
    }),
    defineField({
      name: 'logo',
      title: 'Logo (image, optionnel)',
      type: 'image',
      group: 'brand',
      description: 'Si absent, le nom du site est affiché en texte.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'siteDescription',
      title: 'Description courte du site',
      type: 'string',
      group: 'brand',
      description: 'Affiché dans le footer.',
    }),

    // Nav
    defineField({
      name: 'announcementBar',
      title: 'Barre d\'annonce',
      type: 'string',
      group: 'nav',
      description: 'Texte en haut de page. Laisser vide pour masquer.',
      initialValue: 'Livraison gratuite au Maroc • Paiement à la livraison • Retours sous 7 jours',
    }),
    defineField({
      name: 'navLinks',
      title: 'Liens de navigation',
      type: 'array',
      of: [{ type: 'navLink' }],
      group: 'nav',
    }),

    // Contact
    defineField({
      name: 'whatsappNumber',
      title: 'Numéro WhatsApp',
      type: 'string',
      group: 'contact',
      description: 'Format international sans "+". Ex: 212612345678',
      initialValue: '212600000000',
    }),
    defineField({
      name: 'phone',
      title: 'Numéro de téléphone affiché',
      type: 'string',
      group: 'contact',
      description: 'Affiché dans le menu mobile. Ex: +212 6XX XX XX XX',
    }),
    defineField({ name: 'instagramUrl', title: 'Instagram URL', type: 'url', group: 'contact' }),
    defineField({ name: 'facebookUrl',  title: 'Facebook URL',  type: 'url', group: 'contact' }),
    defineField({ name: 'tiktokUrl',    title: 'TikTok URL',    type: 'url', group: 'contact' }),

    // Tracking
    defineField({
      name: 'metaPixelId',
      title: 'Meta Pixel ID',
      type: 'string',
      group: 'tracking',
      description: 'Ex: 1234567890123456',
    }),
    defineField({
      name: 'tiktokPixelId',
      title: 'TikTok Pixel ID',
      type: 'string',
      group: 'tracking',
      description: 'Ex: CXXXXXXXXXXXXXXXXX',
    }),
    defineField({
      name: 'googleAnalyticsId',
      title: 'Google Analytics ID',
      type: 'string',
      group: 'tracking',
      description: 'Ex: G-XXXXXXXXXX',
    }),
    defineField({
      name: 'googleAdsId',
      title: 'Google Ads ID',
      type: 'string',
      group: 'tracking',
      description: 'Ex: AW-XXXXXXXXXX',
    }),

    // Integrations
    defineField({
      name:        'googleSheetsWebhookUrl',
      title:       'Google Sheets — URL du webhook',
      type:        'url',
      group:       'integrations',
      description: 'URL d\'un Google Apps Script (doPost) déployé en tant que "Web App". '
                 + 'Chaque nouvelle commande sera envoyée automatiquement à cette URL en JSON.',
    }),

    // Trust badges (product page)
    defineField({
      name: 'trustBadges',
      title: 'Badges de confiance',
      type: 'array',
      of: [{ type: 'trustItem' }],
      group: 'trust',
      description: 'Affichés sur la page produit, près du formulaire.',
    }),

    // Footer
    defineField({
      name: 'footerNavLinks',
      title: 'Liens de navigation (footer)',
      type: 'array',
      of: [{ type: 'navLink' }],
      group: 'footer',
    }),
    defineField({
      name: 'footerCommitments',
      title: 'Engagements (footer)',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'footer',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'footerCopyright',
      title: 'Texte de copyright',
      type: 'string',
      group: 'footer',
      description: 'L\'année en cours est ajoutée automatiquement.',
    }),
    defineField({
      name: 'footerTagline',
      title: 'Slogan footer (bandeau CTA)',
      type: 'string',
      group: 'footer',
    }),
    defineField({
      name: 'footerCtaSubtitle',
      title: 'Sous-titre CTA footer',
      type: 'string',
      group: 'footer',
    }),
  ],
  preview: {
    prepare() { return { title: 'Paramètres du site' } },
  },
})
