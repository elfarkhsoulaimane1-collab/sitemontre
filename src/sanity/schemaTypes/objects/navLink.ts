import { defineField, defineType } from 'sanity'

export const navLinkType = defineType({
  name: 'navLink',
  title: 'Lien de navigation',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Libellé', type: 'string' }),
    defineField({ name: 'href',  title: 'URL',     type: 'string', description: 'Ex: /collection' }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})
