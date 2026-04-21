import { defineField, defineType } from 'sanity'
import { StarIcon } from '@sanity/icons'

export const reviewType = defineType({
  name:  'review',
  title: 'Avis clients',
  type:  'document',
  icon:  StarIcon,
  fields: [
    defineField({
      name:  'name',
      title: 'Nom du client',
      type:  'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name:    'rating',
      title:   'Note (1 – 5)',
      type:    'number',
      options: { list: [1, 2, 3, 4, 5], layout: 'radio' },
      validation: (R) => R.required().min(1).max(5).integer(),
    }),
    defineField({
      name:  'comment',
      title: 'Commentaire',
      type:  'text',
      rows:  4,
      validation: (R) => R.required().min(10).max(1000),
    }),
    defineField({
      name:    'product',
      title:   'Produit',
      type:    'reference',
      to:      [{ type: 'product' }],
      validation: (R) => R.required(),
    }),
    defineField({
      name:         'approved',
      title:        'Approuvé',
      type:         'boolean',
      initialValue: false,
      description:  'Cochez pour publier cet avis sur la page produit.',
    }),
    defineField({
      name:         'seeded',
      title:        'Avis auto-généré',
      type:         'boolean',
      initialValue: false,
      description:  'Généré automatiquement à l\'import — modifiable librement.',
    }),
  ],
  preview: {
    select: {
      title:    'name',
      subtitle: 'comment',
      approved: 'approved',
      rating:   'rating',
    },
    prepare({ title, subtitle, approved, rating }) {
      const stars = '★'.repeat(rating ?? 0) + '☆'.repeat(5 - (rating ?? 0))
      return {
        title:    `${approved ? '✓' : '⏳'} ${title ?? 'Sans nom'}`,
        subtitle: `${stars}  ${subtitle ?? ''}`.slice(0, 80),
      }
    },
  },
  orderings: [
    { title: 'Date (récent)', name: 'dateDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
    { title: 'En attente',   name: 'pending',  by: [{ field: 'approved',   direction: 'asc'  }] },
  ],
})
