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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Fakture</h1>
      </div>

      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : invoices.length === 0 ? <EmptyState icon="🧾" title="Nema faktura" message="Fakture se kreiraju iz prihvaćenih ponuda" />
        : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors block">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{inv.client?.name || '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono mr-2">#{inv.invoice_number}</span>
                    {new Date(inv.issued_at).toLocaleDateString('sr-RS')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-sm text-gray-800">{(inv.total || 0).toLocaleString('sr-RS')} RSD</span>
                  <StatusBadge status={inv.status} small />
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
