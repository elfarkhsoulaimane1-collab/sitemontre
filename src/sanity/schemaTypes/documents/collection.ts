import { defineField, defineType } from 'sanity'

export const collectionType = defineType({
  name: 'collection',
  title: 'Collections',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Libellé affiché',
      type: 'string',
      description: 'Ex: Luxe, Classique, Sport, Minimaliste',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: { source: 'label', maxLength: 48 },
      description: 'Doit correspondre à la catégorie du produit (ex: luxury, classic, sport, minimalist).',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'subLabel',
      title: 'Sous-titre',
      type: 'string',
      description: 'Ex: Prestige & raffinement',
    }),
    defineField({
      name: 'image',
      title: 'Image de la collection',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      initialValue: 99,
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'subLabel', media: 'image' },
  },
  orderings: [
    { title: 'Ordre d\'affichage', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
})
