import { defineField, defineType } from 'sanity'

export const trustItemType = defineType({
  name: 'trustItem',
  title: 'Élément de confiance',
  type: 'object',
  fields: [
    defineField({ name: 'icon',     title: 'Icône (emoji)',  type: 'string' }),
    defineField({ name: 'title',    title: 'Titre',          type: 'string' }),
    defineField({ name: 'subtitle', title: 'Sous-titre',     type: 'string' }),
  ],
  preview: { select: { title: 'title', subtitle: 'subtitle' } },
})
