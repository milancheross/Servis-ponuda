'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function fmt(n: number) { return (n || 0).toLocaleString('sr-RS') + ' RSD' }
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) }

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(d => { setQuotes(d || []); setLoading(false) })
  }, [])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ponude</h1>
        <Link href="/quotes/new" className="hidden md:inline-flex bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Nova ponuda
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <div className="font-medium">Još nema ponuda</div>
          <Link href="/quotes/new" className="mt-4 inline-block bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            Napravi prvu ponudu
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q: any) => {
            const staleReminder = q.status === 'poslata' && q.sent_at && daysSince(q.sent_at) >= 7
            return (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm border border-gray-100 transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{q.client?.name || '—'}</span>
                    {staleReminder && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">{daysSince(q.sent_at)}d</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{q.quote_number} · {fmt(q.total_amount)}</div>
                </div>
                <div className="ml-3"><StatusBadge status={q.status} small /></div>
              </Link>
            )
          })}
        </div>
      )}

      <Link href="/quotes/new" className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center text-2xl shadow-lg z-30">
        +
      </Link>
    </div>
  )
}
