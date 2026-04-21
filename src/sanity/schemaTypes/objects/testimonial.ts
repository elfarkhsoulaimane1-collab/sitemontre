import { defineField, defineType } from 'sanity'

export const testimonialType = defineType({
  name: 'testimonial',
  title: 'Témoignage',
  type: 'object',
  fields: [
    defineField({ name: 'name',     title: 'Nom du client',   type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'city',     title: 'Ville',           type: 'string' }),
    defineField({ name: 'product',  title: 'Produit acheté',  type: 'string' }),
    defineField({
      name: 'rating',
      title: 'Note (1–5)',
      type: 'number',
      options: { list: [1, 2, 3, 4, 5] },
      initialValue: 5,
      validation: (R) => R.required().min(1).max(5),
    }),
    defineField({ name: 'text',     title: 'Avis client',     type: 'text', rows: 4, validation: (R) => R.required() }),
    defineField({
      name: 'verified',
      title: 'Achat vérifié',
      type: 'boolean',
      description: 'Cocher si cet achat a été vérifié — affiche le badge "Vérifié" sur le site.',
      initialValue: true,
    }),
    defineField({
      name: 'avatar',
      title: 'Photo du client (optionnel)',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'product', media: 'avatar' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle ?? 'Sans produit', media }
    },
  },
})
