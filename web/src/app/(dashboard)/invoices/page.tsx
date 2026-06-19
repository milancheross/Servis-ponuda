'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

const FILTERS = [
  { value: '', label: 'Sve' },
  { value: 'neplaceno', label: 'Neplaćeno' },
  { value: 'placeno', label: 'Plaćeno' },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = filter ? `/api/invoices?status=${filter}` : '/api/invoices'
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setInvoices(d.invoices || []); setLoading(false) })
  }, [filter])

  const unpaidTotal = invoices.filter(i => i.status === 'neplaceno').reduce((s, i) => s + (i.total || 0), 0)

  return (
    <div className="pb-32">
      <div className="sticky top-14 md:top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Fakture</h1>
          {unpaidTotal > 0 && <span className="text-sm font-semibold text-orange-600">{unpaidTotal.toLocaleString('sr-RS')} RSD neplaćeno</span>}
        </div>
        <div className="max-w-2xl mx-auto mt-2 flex gap-2">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f.value ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-3">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState icon="🧾" title="Nema faktura" message="Fakture se kreiraju iz prihvaćenih ponuda" />
        ) : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate">{inv.client?.name || '—'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        <span className="font-mono">№{inv.invoice_number}</span>
                        <span className="mx-1">·</span>
                        {new Date(inv.issued_at).toLocaleDateString('sr-RS')}
                        {inv.due_date && <span className="ml-1 text-orange-500">rok {new Date(inv.due_date).toLocaleDateString('sr-RS')}</span>}
                      </div>
                    </div>
                    <StatusBadge status={inv.status} small />
                  </div>
                  <div className="mt-2 font-bold text-lg text-gray-900">{(inv.total || 0).toLocaleString('sr-RS')} <span className="text-sm font-normal text-gray-400">RSD</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
