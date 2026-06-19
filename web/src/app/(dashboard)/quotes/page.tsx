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

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

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
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-14 md:top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Ponude</h1>
        </div>
        <div className="max-w-2xl mx-auto mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-3">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : quotes.length === 0 ? (
          <EmptyState icon="📋" title="Nema ponuda" message="Kreirajte prvu ponudu" />
        ) : (
          <div className="space-y-2">
            {quotes.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate">{q.client?.name || '—'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {q.quote_number && <span className="text-xs font-mono text-gray-400">{q.quote_number}</span>}
                        <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('sr-RS')}</span>
                        {q.sent_at && q.status === 'poslata' && (
                          <span className="text-xs text-amber-500">⏰ {daysSince(q.sent_at)}d</span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={q.status} small />
                  </div>
                  <div className="mt-2 font-bold text-lg text-gray-900">{(q.total || 0).toLocaleString('sr-RS')} <span className="text-sm font-normal text-gray-400">RSD</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/quotes/new"
        className="fixed bottom-20 md:bottom-6 right-4 bg-[#2563EB] text-white rounded-2xl px-5 py-4 font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2 z-30">
        <span className="text-lg">+</span> Nova ponuda
      </Link>
    </div>
  )
}
