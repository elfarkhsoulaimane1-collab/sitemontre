import { defineField, defineType } from 'sanity'

export const productType = defineType({
  name: 'product',
  title: 'Produits',
  type: 'document',
  groups: [
    { name: 'info',     title: 'Infos générales', default: true },
    { name: 'ordering', title: 'Ordre d\'affichage' },
    { name: 'pricing',  title: 'Prix & stock' },
    { name: 'media',    title: 'Images' },
    { name: 'seo',      title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Nom du produit',
      type: 'string',
      group: 'info',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'info',
      options: { source: 'name', maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'brand',
      title: 'Marque',
      type: 'string',
      group: 'info',
      initialValue: 'Maison du Prestige',
    }),
    defineField({
      name: 'description',
      title: 'Accroche courte',
      type: 'string',
      group: 'info',
      description: 'Tagline affiché sous le nom dans les cartes produit.',
      validation: (R) => R.max(120),
    }),
    defineField({
      name: 'longDescription',
      title: 'Description complète (texte simple)',
      type: 'text',
      rows: 5,
      group: 'info',
      description: 'Utilisé uniquement si la description enrichie est vide.',
    }),
    defineField({
      name: 'richDescription',
      title: 'Description enrichie (texte + images)',
      type: 'array',
      group: 'info',
      description: 'Remplace la description complète si remplie. Insérez des images n\'importe où.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Titre H2', value: 'h2' },
            { title: 'Titre H3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Gras', value: 'strong' },
              { title: 'Italique', value: 'em' },
            ],
          },
        },
        {
          type: 'image',
          name: 'imageBlock',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texte alternatif',
              type: 'string',
            }),
            defineField({
              name: 'size',
              title: 'Taille',
              type: 'string',
              options: {
                list: [
                  { title: 'Petite', value: 'small' },
                  { title: 'Moyenne', value: 'medium' },
                  { title: 'Grande', value: 'large' },
                  { title: 'Pleine largeur', value: 'full' },
                ],
                layout: 'radio',
              },
              initialValue: 'medium',
            }),
            defineField({
              name: 'alignment',
              title: 'Alignement',
              type: 'string',
              options: {
                list: [
                  { title: 'Gauche', value: 'left' },
                  { title: 'Centre', value: 'center' },
                  { title: 'Droite', value: 'right' },
                ],
                layout: 'radio',
              },
              initialValue: 'center',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'features',
      title: 'Caractéristiques techniques',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'info',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      group: 'info',
      description: 'Collection à laquelle appartient ce produit.',
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: 'Luxe',         value: 'luxury' },
          { title: 'Classique',    value: 'classic' },
          { title: 'Sport',        value: 'sport' },
          { title: 'Minimaliste',  value: 'minimalist' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      group: 'info',
      options: {
        list: [
          { title: 'Bestseller', value: 'Bestseller' },
          { title: 'Nouveau',    value: 'New' },
          { title: 'Soldes',     value: 'Sale' },
          { title: 'Limité',     value: 'Limited' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'price',
      title: 'Prix (MAD)',
      type: 'number',
      group: 'pricing',
      validation: (R) => R.required().positive(),
    }),
    defineField({
      name: 'originalPrice',
      title: 'Prix barré (MAD)',
      type: 'number',
      group: 'pricing',
      description: 'Laissez vide s\'il n\'y a pas de remise.',
    }),
    defineField({
      name: 'inStock',
      title: 'En stock',
      type: 'boolean',
      group: 'pricing',
      initialValue: true,
    }),
    defineField({
      name: 'rating',
      title: 'Note moyenne (ex: 4.9)',
      type: 'number',
      group: 'info',
      initialValue: 4.9,
    }),
    defineField({
      name: 'reviews',
      title: 'Nombre d\'avis',
      type: 'number',
      group: 'info',
      initialValue: 0,
    }),
    defineField({
      name: 'images',
      title: 'Photos du produit',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      group: 'media',
      validation: (R) => R.required().min(1),
      description: 'La première image est utilisée comme photo principale.',
    }),
    defineField({
      name: 'position',
      title: 'Position dans la collection',
      type: 'number',
      group: 'ordering',
      description: 'Numéro d\'ordre d\'affichage (1 = premier). Laissez vide pour trier par date de création.',
    }),
    defineField({
      name: 'faq',
      title: 'FAQ produit',
      type: 'array',
      group: 'info',
      description: 'Questions fréquentes spécifiques à ce produit (2–4 recommandées).',
      of: [{
        type: 'object',
        name: 'faqItem',
        title: 'Question / Réponse',
        fields: [
          defineField({ name: 'question', title: 'Question', type: 'string', validation: R => R.required() }),
          defineField({ name: 'answer',   title: 'Réponse',  type: 'text', rows: 3, validation: R => R.required() }),
        ],
        preview: { select: { title: 'question' } },
      }],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title:    'name',
      subtitle: 'price',
      media:    'images.0',
      position: 'position',
    },
    prepare({ title, subtitle, media, position }) {
      return {
        title,
        subtitle: [
          position != null ? `#${position}` : null,
          subtitle ? `${subtitle.toLocaleString('fr-MA')} MAD` : '',
        ].filter(Boolean).join(' · '),
        media,
      }
    },
  },
  orderings: [
    { title: 'Position manuelle', name: 'positionAsc', by: [{ field: 'position', direction: 'asc' }, { field: '_createdAt', direction: 'desc' }] },
    { title: 'Nom A–Z',        name: 'nameAsc',    by: [{ field: 'name',  direction: 'asc'  }] },
    { title: 'Prix croissant', name: 'priceAsc',   by: [{ field: 'price', direction: 'asc'  }] },
    { title: 'Prix décroissant',name: 'priceDesc',  by: [{ field: 'price', direction: 'desc' }] },
  ],
})
