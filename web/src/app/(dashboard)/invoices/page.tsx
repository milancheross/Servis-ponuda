'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

const FILTERS = [{ value: '', label: 'Sve' }, { value: 'neplaceno', label: 'Neplaćeno' }, { value: 'placeno', label: 'Plaćeno' }]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = filter ? `/api/invoices?status=${filter}` : '/api/invoices'
    fetch(url, { credentials: 'include' }).then(r => r.json()).then(d => { setInvoices(d.invoices || []); setLoading(false) })
  }, [filter])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fakture</h1>
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f.value ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>
      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : invoices.length === 0 ? <EmptyState icon="🧾" title="Nema faktura" message="Fakture se kreiraju konverzijom prihvaćenih ponuda" />
        : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Broj</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Klijent</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Datum</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Iznos</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono"><Link href={`/invoices/${inv.id}`} className="hover:text-blue-600">{inv.invoice_number}</Link></td>
                    <td className="px-6 py-4 font-medium">{inv.client?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(inv.issued_at).toLocaleDateString('sr-RS')}</td>
                    <td className="px-6 py-4 text-right font-semibold">{(inv.total||0).toLocaleString('sr-RS')} RSD</td>
                    <td className="px-6 py-4 text-right"><StatusBadge status={inv.status} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
