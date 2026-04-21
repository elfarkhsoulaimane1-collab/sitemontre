import { createClient } from 'next-sanity'
import OrdersDashboardWrapper from './OrdersDashboardWrapper'
import { ORDERS_QUERY } from '@/sanity/lib/queries'
import { Order } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  let initialOrders: Order[] = []
  let fetchError: string | null = null

  const projectId  = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
  const dataset    = process.env.NEXT_PUBLIC_SANITY_DATASET     ?? 'production'
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2024-01-01'
  const readToken  = process.env.SANITY_API_READ_TOKEN          ?? ''

  if (projectId && readToken) {
    try {
      const sanity = createClient({ projectId, dataset, apiVersion, token: readToken, useCdn: false })
      initialOrders = await sanity.fetch<Order[]>(ORDERS_QUERY, {}, { cache: 'no-store' }) ?? []
    } catch (e) {
      fetchError = e instanceof Error ? e.message : String(e)
    }
  }

  return <OrdersDashboardWrapper initialOrders={initialOrders} fetchError={fetchError} />
}
