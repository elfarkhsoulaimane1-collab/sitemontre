import { defineField, defineType } from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Blog',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'Accessible à /blog/[slug]',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Image principale',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texte alternatif',
          type: 'string',
          validation: (R) => R.required(),
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'string',
      group: 'content',
      description: 'Nom de l\'auteur affiché sur l\'article (ex : Équipe Maison du Prestige)',
      initialValue: 'Équipe Maison du Prestige',
    }),
    defineField({
      name: 'excerpt',
      title: 'Extrait',
      type: 'text',
      group: 'content',
      rows: 3,
      validation: (R) => R.max(200),
      description: '200 caractères max — affiché dans les listes d\'articles',
    }),
    defineField({
      name: 'content',
      title: 'Contenu',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal',   value: 'normal' },
            { title: 'Titre H2', value: 'h2'     },
            { title: 'Titre H3', value: 'h3'     },
            { title: 'Citation', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Gras',      value: 'strong' },
              { title: 'Italique',  value: 'em'     },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Lien',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Texte alternatif',
              type: 'string',
            }),
            defineField({
              name: 'caption',
              title: 'Légende',
              type: 'string',
            }),
          ],
        },
      ],
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
      title:    'title',
      subtitle: 'publishedAt',
      media:    'mainImage',
    },
    prepare({ title, subtitle, media }) {
      const date = subtitle
        ? new Date(subtitle).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Non publié'
      return { title, subtitle: date, media }
    },
  },
  orderings: [
    {
      title: 'Date de publication (récent → ancien)',
      name:  'publishedAtDesc',
      by:    [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
