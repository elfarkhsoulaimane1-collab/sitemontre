import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from '../src/sanity/schemaTypes'

const SINGLETONS = new Set(['siteSettings', 'homePage'])

export default defineConfig({
  name:    'atlas-watches',
  title:   'Maison du Prestige — Admin',

  projectId: '1u8lkn99',
  dataset:   'production',

  schema: { types: schemaTypes },

  plugins: [
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
            S.documentTypeListItem('product').title('Produits'),
            S.documentTypeListItem('collection').title('Collections'),
            S.divider(),
            S.documentTypeListItem('page').title('Pages'),
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
