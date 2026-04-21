import { defineField, defineType } from 'sanity'
import { PackageIcon } from '@sanity/icons'

const STATUS_OPTIONS = [
  { value: 'new',       title: '🆕 Nouvelle'   },
  { value: 'confirmed', title: '✅ Confirmée'  },
  { value: 'shipped',   title: '🚚 Expédiée'   },
  { value: 'delivered', title: '📦 Livrée'     },
  { value: 'cancelled', title: '❌ Annulée'    },
]

const STATUS_EMOJI: Record<string, string> = {
  new: '🆕', confirmed: '✅', shipped: '🚚', delivered: '📦', cancelled: '❌',
}

export const orderType = defineType({
  name:  'order',
  title: 'Commandes',
  type:  'document',
  icon:  PackageIcon,

  groups: [
    { name: 'info',     title: 'Commande',  default: true },
    { name: 'customer', title: 'Client'    },
    { name: 'items',    title: 'Articles'  },
    { name: 'amounts',  title: 'Montants'  },
  ],

  fields: [
    // ── Order info ───────────────────────────────────────────────────────────
    defineField({
      name:      'orderRef',
      title:     'Référence',
      type:      'string',
      group:     'info',
      readOnly:  true,
      validation: R => R.required(),
    }),
    defineField({
      name:         'status',
      title:        'Statut',
      type:         'string',
      group:        'info',
      initialValue: 'new',
      options:      { list: STATUS_OPTIONS, layout: 'radio' },
      validation:   R => R.required(),
    }),
    defineField({
      name:     'createdAt',
      title:    'Date de commande',
      type:     'datetime',
      group:    'info',
      readOnly: true,
    }),

    // ── Customer ─────────────────────────────────────────────────────────────
    defineField({ name: 'firstName', title: 'Prénom',    type: 'string', group: 'customer', readOnly: true }),
    defineField({ name: 'lastName',  title: 'Nom',       type: 'string', group: 'customer', readOnly: true }),
    defineField({ name: 'phone',     title: 'Téléphone', type: 'string', group: 'customer', readOnly: true }),
    defineField({ name: 'city',      title: 'Ville',     type: 'string', group: 'customer', readOnly: true }),
    defineField({ name: 'address',   title: 'Adresse',   type: 'text',   group: 'customer', rows: 2, readOnly: true }),
    defineField({ name: 'notes',     title: 'Notes livraison', type: 'text', group: 'customer', rows: 2 }),

    // ── Items ────────────────────────────────────────────────────────────────
    defineField({
      name:     'items',
      title:    'Articles commandés',
      type:     'array',
      group:    'items',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'productName', title: 'Produit',       type: 'string' }),
            defineField({ name: 'quantity',    title: 'Qté',           type: 'number' }),
            defineField({ name: 'unitPrice',   title: 'Prix unitaire', type: 'number' }),
            defineField({ name: 'totalPrice',  title: 'Sous-total',    type: 'number' }),
          ],
          preview: {
            select: { name: 'productName', qty: 'quantity', price: 'totalPrice' },
            prepare({ name, qty, price }) {
              return {
                title:    `${name ?? '—'}`,
                subtitle: `×${qty ?? 0}  —  ${Number(price ?? 0).toLocaleString('fr-MA')} MAD`,
              }
            },
          },
        },
      ],
    }),

    // ── Amounts ──────────────────────────────────────────────────────────────
    defineField({ name: 'subtotal', title: 'Sous-total (MAD)', type: 'number', group: 'amounts', readOnly: true }),
    defineField({ name: 'shipping', title: 'Livraison (MAD)',  type: 'number', group: 'amounts', readOnly: true }),
    defineField({ name: 'total',    title: 'Total (MAD)',      type: 'number', group: 'amounts', readOnly: true }),
  ],

  preview: {
    select: {
      ref:    'orderRef',
      first:  'firstName',
      last:   'lastName',
      status: 'status',
      total:  'total',
      city:   'city',
    },
    prepare({ ref, first, last, status, total, city }) {
      return {
        title:    `${STATUS_EMOJI[status] ?? '📋'} ${ref ?? ''} — ${first ?? ''} ${last ?? ''}`,
        subtitle: `${city ?? ''} · ${Number(total ?? 0).toLocaleString('fr-MA')} MAD`,
      }
    },
  },

  orderings: [
    { title: 'Date (récent en premier)', name: 'dateDesc',  by: [{ field: 'createdAt', direction: 'desc' }] },
    { title: 'Nouvelles en premier',     name: 'newFirst',  by: [{ field: '_createdAt', direction: 'desc' }] },
  ],
})
