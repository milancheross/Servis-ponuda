'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function fmt(n: number) { return (n || 0).toLocaleString('sr-RS') + ' RSD' }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(d => { setInvoices(d || []); setLoading(false) })
  }, [])

  const unpaidTotal = invoices.filter(i => i.status === 'neplaceno').reduce((s, i) => s + (i.total_amount || 0), 0)

  return (
    <div className="p-4 md:p-8">
      <div className="sticky top-14 md:top-0 z-10 bg-gray-50 pb-3 -mx-4 px-4 md:-mx-8 md:px-8">
        <h1 className="text-xl font-bold text-gray-900">Fakture</h1>
        {!loading && unpaidTotal > 0 && (
          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 inline-flex items-center gap-2">
            <span className="text-orange-700 text-sm font-medium">Čeka naplatu:</span>
            <span className="text-orange-800 font-bold">{fmt(unpaidTotal)}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🧾</div>
            <div className="font-medium">Još nema faktura</div>
            <p className="text-sm mt-1">Fakture se kreiraju iz prihvaćenih ponuda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm border border-gray-100 transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{inv.client?.name || '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{inv.invoice_number} · {fmt(inv.total_amount)}{inv.due_date && ` · Rok: ${inv.due_date}`}</div>
                </div>
                <div className="ml-3"><StatusBadge status={inv.status} small /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
