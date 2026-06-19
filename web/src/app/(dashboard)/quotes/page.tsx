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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ponude</h1>
        <Link href="/quotes/new" className="bg-[#2563EB] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nova ponuda</Link>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>{f.label}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : quotes.length === 0 ? <EmptyState icon="📋" title="Nema ponuda" message="Kreirajte prvu ponudu" />
        : (
          <div className="space-y-2">
            {quotes.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors block">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{q.client?.name || '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {q.quote_number && <span className="font-mono mr-2">{q.quote_number}</span>}
                    {new Date(q.created_at).toLocaleDateString('sr-RS')}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-sm text-gray-800">{(q.total || 0).toLocaleString('sr-RS')} RSD</span>
                  <StatusBadge status={q.status} small />
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
