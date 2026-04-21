import { defineField, defineType } from 'sanity'

export const homepageTestimonialType = defineType({
  name:  'homepageTestimonial',
  title: 'Témoignages (accueil)',
  type:  'document',
  fields: [
    defineField({
      name:  'name',
      title: 'Nom du client',
      type:  'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name:  'city',
      title: 'Ville',
      type:  'string',
    }),
    defineField({
      name:  'productName',
      title: 'Produit acheté',
      type:  'string',
    }),
    defineField({
      name:     'rating',
      title:    'Note (1–5)',
      type:     'number',
      options:  { list: [1, 2, 3, 4, 5] },
      initialValue: 5,
      validation: (R) => R.required().min(1).max(5),
    }),
    defineField({
      name:  'review',
      title: 'Avis client',
      type:  'text',
      rows:  4,
      validation: (R) => R.required(),
    }),
    defineField({
      name:        'verified',
      title:       'Achat vérifié',
      type:        'boolean',
      description: 'Affiche le badge "Vérifié" sur le site.',
      initialValue: true,
    }),
    defineField({
      name:    'avatar',
      title:   'Photo du client (optionnel)',
      type:    'image',
      options: { hotspot: true },
    }),
    defineField({
      name:        'order',
      title:       'Ordre d\'affichage',
      type:        'number',
      description: 'Les 3 témoignages avec le chiffre le plus bas apparaissent en premier.',
      initialValue: 99,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'productName', media: 'avatar' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ?? 'Sans produit', media }
    },
  },
  orderings: [
    {
      title: 'Ordre d\'affichage',
      name:  'orderAsc',
      by:    [{ field: 'order', direction: 'asc' }],
    },
  ],
})
