import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemaTypes'
import { importPlugin } from './src/sanity/tools/importPlugin'

const SINGLETONS = new Set(['siteSettings', 'homePage'])

export default defineConfig({
  name:    'atlas-watches',
  title:   'Maison du Prestige — Admin',
  basePath: '/studio',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '1u8lkn99',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production',

  schema: { types: schemaTypes },

  plugins: [
    importPlugin(),
    structureTool({
      structure: (S) =>
        S.list()
          .title('Maison du Prestige')
          .items([
            S.listItem()
              .title('Paramètres du site')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.listItem()
              .title("Page d'accueil")
              .id('homePage')
              .child(S.document().schemaType('homePage').documentId('homePage')),

            S.divider(),

            // ── Orders ──────────────────────────────────────────────────────
            S.listItem()
              .title('🆕 Nouvelles commandes')
              .id('orders-new')
              .child(
                S.documentList()
                  .title('Nouvelles commandes')
                  .schemaType('order')
                  .filter('_type == "order" && status == "new"')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
              ),
            S.listItem()
              .title('🚚 Commandes en cours')
              .id('orders-active')
              .child(
                S.documentList()
                  .title('Commandes en cours')
                  .schemaType('order')
                  .filter('_type == "order" && status in ["confirmed", "shipped"]')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }]),
              ),
            S.documentTypeListItem('order').title('Toutes les commandes'),

            S.divider(),

            S.documentTypeListItem('product').title('Produits'),
            S.documentTypeListItem('collection').title('Collections'),

            S.divider(),

            S.documentTypeListItem('page').title('Pages (politique, contact…)'),
            S.documentTypeListItem('post').title('Blog — Articles'),

            S.divider(),

            S.documentTypeListItem('homepageTestimonial').title('⭐ Témoignages — Accueil'),

            S.divider(),

            S.listItem()
              .title('Avis en attente')
              .id('reviews-pending')
              .child(
                S.documentList()
                  .title('Avis en attente de modération')
                  .schemaType('review')
                  .filter('_type == "review" && approved == false')
                  .defaultOrdering([{ field: '_createdAt', direction: 'desc' }]),
              ),
            S.documentTypeListItem('review').title('Tous les avis'),
          ]),
    }),
    visionTool(),
  ],

  document: {
    newDocumentOptions: (prev) =>
      prev.filter((opt) => !SINGLETONS.has(opt.templateId)),
    actions: (prev, ctx) =>
      SINGLETONS.has(ctx.schemaType)
        ? prev.filter(({ action }) => action !== 'duplicate')
        : prev,
  },
})
