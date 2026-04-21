import { defineField, defineType } from 'sanity'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'title',       title: 'Titre SEO',         type: 'string' }),
    defineField({ name: 'description', title: 'Description SEO',   type: 'text',  rows: 3 }),
    defineField({ name: 'keywords',    title: 'Mots-clés',         type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'ogImage',     title: 'Image Open Graph',  type: 'image', description: '1200×630px recommandé.' }),
  ],
  options: { collapsible: true, collapsed: true },
})
