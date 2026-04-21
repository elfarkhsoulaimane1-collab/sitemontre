import { defineField, defineType } from 'sanity'

export const statType = defineType({
  name: 'stat',
  title: 'Statistique',
  type: 'object',
  fields: [
    defineField({ name: 'value', title: 'Valeur', type: 'string', description: 'Ex: 8 000+' }),
    defineField({ name: 'label', title: 'Label',  type: 'string', description: 'Ex: Clients satisfaits' }),
  ],
  preview: { select: { title: 'value', subtitle: 'label' } },
})
