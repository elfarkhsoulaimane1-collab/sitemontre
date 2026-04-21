import { defineField, defineType } from 'sanity'

export const pageType = defineType({
  name: 'page',
  title: 'Pages',
  type: 'document',
  groups: [
    { name: 'content', title: 'Contenu', default: true },
    { name: 'seo',     title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Titre de la page',
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
      description: 'La page sera accessible à /pages/[slug]',
      validation: (R) => R.required(),
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
            { title: 'Normal',    value: 'normal'  },
            { title: 'Titre H2',  value: 'h2'      },
            { title: 'Titre H3',  value: 'h3'      },
          ],
          marks: {
            decorators: [
              { title: 'Gras',      value: 'strong' },
              { title: 'Italique',  value: 'em' },
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
      ],
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
    prepare({ title, subtitle }) {
      return { title, subtitle: `/pages/${subtitle}` }
    },
  },
})
