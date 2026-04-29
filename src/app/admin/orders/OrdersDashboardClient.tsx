'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Order, OrderStatus } from '@/types'

// ── Status metadata ──────────────────────────────────────────────────────────

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  new:       { label: 'Nouvelle',  cls: 'text-blue-400   bg-blue-400/10   border-blue-400/30'   },
  confirmed: { label: 'Confirmée', cls: 'text-amber-400  bg-amber-400/10  border-amber-400/30'  },
  shipped:   { label: 'Expédiée',  cls: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  delivered: { label: 'Livrée',    cls: 'text-green-400  bg-green-400/10  border-green-400/30'  },
  cancelled: { label: 'Annulée',   cls: 'text-red-400    bg-red-400/10    border-red-400/30'    },
}

const ALL_STATUSES = Object.keys(STATUS_META) as OrderStatus[]

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialOrders: Order[]
  fetchError?: string | null
}

export default function OrdersDashboardClient({ initialOrders, fetchError }: Props) {
  const router = useRouter()
  const [orders,       setOrders]       = useState<Order[]>(initialOrders)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [updating,    setUpdating]    = useState<string | null>(null)
  const [globalError, setGlobalError] = useState(fetchError ?? '')

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = orders.length
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total ?? 0), 0)
    const newCount = orders.filter(o => o.status === 'new').length
    const today    = new Date().toDateString()
    const todayCount = orders.filter(o => o.createdAt && new Date(o.createdAt).toDateString() === today).length
    return { total, revenue, newCount, todayCount }
  }, [orders])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = orders
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(o =>
        o.orderRef?.toLowerCase().includes(q) ||
        o.firstName?.toLowerCase().includes(q) ||
        o.lastName?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.city?.toLowerCase().includes(q),
      )
    }
    return list
  }, [orders, statusFilter, search])

  // ── Status update ─────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: OrderStatus) {
    setUpdating(id)
    setGlobalError('')
    // Optimistic update
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o))

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setGlobalError(d.error ?? 'Erreur lors de la mise à jour du statut')
        router.refresh() // revert via server re-render
      }
    } catch {
      setGlobalError('Erreur réseau lors de la mise à jour')
      router.refresh()
    } finally {
      setUpdating(null)
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function exportCSV() {
    const headers = [
      'Réf', 'Prénom', 'Nom', 'Téléphone', 'Ville', 'Adresse',
      'Articles', 'Sous-total', 'Livraison', 'Total', 'Statut', 'Date',
    ]
    const rows = filtered.map(o => [
      o.orderRef ?? '',
      o.firstName ?? '',
      o.lastName  ?? '',
      o.phone     ?? '',
      o.city      ?? '',
      `"${(o.address ?? '').replace(/"/g, '""')}"`,
      `"${(o.items ?? []).map(i => `${i.productName} ×${i.quantity}`).join(', ')}"`,
      o.subtotal ?? 0,
      o.shipping ?? 0,
      o.total    ?? 0,
      STATUS_META[o.status]?.label ?? o.status,
      o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-MA') : '',
    ])
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `commandes-mdp-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-neutral-500 text-sm uppercase tracking-[0.2em] mb-1">Administration</p>
            <h1 className="font-serif text-3xl text-white">Commandes</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="btn-outline text-sm px-4 py-2">
              Exporter CSV
            </button>
            <button onClick={logout} className="btn-ghost text-sm px-4 py-2">
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total commandes"    value={String(stats.total)}                                       />
          <StatCard label="Chiffre d'affaires" value={`${stats.revenue.toLocaleString('fr-MA')} MAD`} highlight />
          <StatCard label="Nouvelles"          value={String(stats.newCount)}                                    />
          <StatCard label="Aujourd'hui"        value={String(stats.todayCount)}                                  />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher par réf, nom, téléphone, ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field w-full sm:max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <FilterTab
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label="Toutes"
              count={orders.length}
            />
            {ALL_STATUSES.map(s => (
              <FilterTab
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={STATUS_META[s].label}
                count={orders.filter(o => o.status === s).length}
              />
            ))}
          </div>
        </div>

        {/* Error banner */}
        {globalError && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex justify-between">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError('')} className="ml-4 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-sm">
              Aucune commande trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-800">
                    {['Réf', 'Client', 'Ville', 'Articles', 'Total', 'Statut', 'Date'].map(h => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-neutral-400 font-normal text-xs uppercase tracking-wider ${
                          h === 'Total' ? 'text-right' : h === 'Statut' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, i) => (
                    <OrderRow
                      key={order._id}
                      order={order}
                      isLast={i === filtered.length - 1}
                      isUpdating={updating === order._id}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-neutral-600 text-xs mt-6">
          {filtered.length} commande{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' || search ? ` · ${orders.length} au total` : ''}
        </p>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-semibold truncate ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function FilterTab({
  active, onClick, label, count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? 'bg-amber-500 text-black border-amber-500'
          : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500 hover:text-white'
      }`}
    >
      {label} <span className={active ? 'opacity-60' : 'opacity-40'}>({count})</span>
    </button>
  )
}

function OrderRow({
  order, isLast, isUpdating, onStatusChange,
}: {
  order: Order
  isLast: boolean
  isUpdating: boolean
  onStatusChange: (id: string, status: OrderStatus) => void
}) {
  const meta         = STATUS_META[order.status] ?? STATUS_META.new
  const itemsSummary = (order.items ?? []).map(i => `${i.productName} ×${i.quantity}`).join(', ')
  const dateStr      = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('fr-MA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <tr
      className={`hover:bg-neutral-900/50 transition-colors ${
        !isLast ? 'border-b border-neutral-800/60' : ''
      }`}
    >
      {/* Ref */}
      <td className="px-4 py-3">
        <span className="font-mono text-amber-400 text-xs">{order.orderRef}</span>
      </td>

      {/* Client */}
      <td className="px-4 py-3">
        <div className="text-white text-sm">{order.firstName} {order.lastName}</div>
        <div className="text-neutral-500 text-xs">{order.phone}</div>
      </td>

      {/* Ville */}
      <td className="px-4 py-3 text-neutral-300 text-sm">{order.city}</td>

      {/* Articles */}
      <td className="px-4 py-3 max-w-[220px]">
        <span className="text-neutral-400 text-xs truncate block" title={itemsSummary}>
          {itemsSummary || '—'}
        </span>
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right font-semibold text-white text-sm whitespace-nowrap">
        {(order.total ?? 0).toLocaleString('fr-MA')} MAD
      </td>

      {/* Statut */}
      <td className="px-4 py-3 text-center">
        <select
          value={order.status}
          onChange={e => onStatusChange(order._id, e.target.value as OrderStatus)}
          disabled={isUpdating}
          className={`text-xs px-2 py-1 rounded-md border font-medium cursor-pointer bg-neutral-900 ${meta.cls} disabled:opacity-40`}
        >
          {ALL_STATUSES.map(s => (
            <option key={s} value={s} className="bg-neutral-900 text-white">
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
        {dateStr}
      </td>
    </tr>
  )
}
