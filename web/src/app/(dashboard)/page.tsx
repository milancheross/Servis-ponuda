'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'

const daysSince = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))

export default function DashboardPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/quotes', { credentials: 'include' }).then(r => r.json()).then(d => setQuotes(d.quotes || []))
    fetch('/api/invoices', { credentials: 'include' }).then(r => r.json()).then(d => setInvoices(d.invoices || []))
    fetch('/api/quotes?reminders=1', { credentials: 'include' }).then(r => r.json()).then(d => setReminders(d.quotes || []))
  }, [])

  const now = new Date()
  const thisMonth = quotes.filter(q => new Date(q.created_at).getMonth() === now.getMonth())
  const totalValue = thisMonth.reduce((s: number, q: any) => s + (q.total || 0), 0)
  const accepted = quotes.filter(q => q.status === 'prihvacena').length
  const unpaid = invoices.filter(i => i.status === 'neplaceno').length
  const recent = quotes.slice(0, 5)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dobrodošli, {user?.company_name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Pregled vaše aktivnosti</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ponude ovog meseca', value: thisMonth.length, icon: '📋' },
          { label: 'Ukupna vrednost', value: `${totalValue.toLocaleString('sr-RS')} RSD`, icon: '💰' },
          { label: 'Prihvaćene ponude', value: accepted, icon: '✅' },
          { label: 'Neplaćene fakture', value: unpaid, icon: '🧾' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 break-words">{value}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔔</span>
            <h2 className="font-semibold text-amber-800">Podsetnici ({reminders.length})</h2>
          </div>
          <div className="space-y-2">
            {reminders.map((q: any) => (
              <div key={q.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-3 border border-amber-100">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{q.client?.name || '—'}</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Poslato pre <span className="font-bold">{daysSince(q.sent_at)} dana</span>
                    {q.quote_number && <span className="ml-2 font-mono">{q.quote_number}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{(q.total || 0).toLocaleString('sr-RS')} RSD</span>
                  <Link href={`/quotes/${q.id}`}
                    className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-600 whitespace-nowrap">
                    Pošalji podsetnik
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <Link href="/quotes/new" className="flex-1 md:flex-none bg-[#2563EB] text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors text-center">+ Nova ponuda</Link>
        <Link href="/clients" className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors text-center">Novi klijent</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Nedavne ponude</h2>
          <Link href="/quotes" className="text-blue-600 text-sm hover:underline">Sve →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Još nema ponuda</div>
        ) : (
          <div>
            {recent.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`}
                className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{q.client?.name || '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {q.quote_number && <span className="font-mono mr-2">{q.quote_number}</span>}
                    {new Date(q.created_at).toLocaleDateString('sr-RS')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="font-semibold text-sm">{(q.total || 0).toLocaleString('sr-RS')} RSD</span>
                  <StatusBadge status={q.status} small />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
