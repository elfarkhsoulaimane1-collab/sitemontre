'use client'
import dynamic from 'next/dynamic'
import { Order } from '@/types'

const OrdersDashboardClient = dynamic(
  () => import('./OrdersDashboardClient'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4 text-center text-neutral-500">
        Chargement…
      </div>
    ),
  },
)

export default function OrdersDashboardWrapper(props: { initialOrders: Order[]; fetchError: string | null }) {
  return <OrdersDashboardClient {...props} />
}
