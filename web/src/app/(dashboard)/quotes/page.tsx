'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

const FILTERS = [
  { value: '', label: 'Sve' },
  { value: 'nacrt', label: 'Nacrt' },
  { value: 'poslata', label: 'Poslata' },
  { value: 'prihvacena', label: 'Prihvaćena' },
  { value: 'odbijena', label: 'Odbijena' },
]

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = filter ? `/api/quotes?status=${filter}` : '/api/quotes'
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setQuotes(d.quotes || []); setLoading(false) })
  }, [filter])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ponude</h1>
        <Link href="/quotes/new" className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nova ponuda</Link>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>
      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : quotes.length === 0 ? <EmptyState icon="📋" title="Nema ponuda" message="Kreirajte prvu ponudu" />
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
                {quotes.map((q: any) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{q.quote_number || '—'}</td>
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/quotes/${q.id}`} className="hover:text-blue-600">{q.client?.name || '—'}</Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(q.created_at).toLocaleDateString('sr-RS')}</td>
                    <td className="px-6 py-4 text-right font-semibold">{(q.total || 0).toLocaleString('sr-RS')} RSD</td>
                    <td className="px-6 py-4 text-right"><StatusBadge status={q.status} small /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
