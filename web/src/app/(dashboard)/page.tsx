'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'

const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000)

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
  const unpaid = invoices.filter(i => i.status === 'neplaceno')
  const unpaidTotal = unpaid.reduce((s, i) => s + (i.total || 0), 0)
  const recent = quotes.slice(0, 4)

  return (
    <div className="p-4 max-w-2xl mx-auto pb-32">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Zdravo, {user?.company_name?.split(' ')[0] || 'majstore'}! 👋</h1>
        <p className="text-gray-400 text-sm">{now.toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1e3a8a] text-white rounded-2xl p-4">
          <div className="text-blue-300 text-xs font-semibold mb-1">Ovaj mesec</div>
          <div className="text-2xl font-bold">{thisMonth.length}</div>
          <div className="text-blue-200 text-xs mt-1">ponuda poslato</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-semibold mb-1">Vrednost</div>
          <div className="text-xl font-bold text-gray-900">{totalValue >= 1000 ? `${(totalValue/1000).toFixed(0)}k` : totalValue.toLocaleString('sr-RS')}</div>
          <div className="text-gray-400 text-xs mt-1">RSD ovaj mesec</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-gray-400 text-xs font-semibold mb-1">Prihvaćeno</div>
          <div className="text-2xl font-bold text-green-600">{accepted}</div>
          <div className="text-gray-400 text-xs mt-1">ponuda ukupno</div>
        </div>
        <div className={`rounded-2xl p-4 border shadow-sm ${unpaid.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
          <div className={`text-xs font-semibold mb-1 ${unpaid.length > 0 ? 'text-orange-600' : 'text-gray-400'}`}>Neplaćeno</div>
          <div className={`text-2xl font-bold ${unpaid.length > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{unpaid.length}</div>
          <div className={`text-xs mt-1 ${unpaid.length > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {unpaidTotal > 0 ? `${(unpaidTotal/1000).toFixed(0)}k RSD` : 'faktura'}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-5">
        <Link href="/quotes/new" className="flex-1 bg-[#2563EB] text-white rounded-xl py-4 font-bold text-center text-sm shadow-sm hover:bg-blue-700">
          + Nova ponuda
        </Link>
        <Link href="/clients" className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-xl py-4 font-bold text-center text-sm hover:bg-gray-50">
          + Klijent
        </Link>
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span>🔔</span>
            <span className="font-bold text-amber-800 text-sm">Podsetnici — {reminders.length} bez odgovora</span>
          </div>
          <div className="space-y-2">
            {reminders.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`}
                className="flex items-center justify-between bg-white rounded-xl px-3 py-3 border border-amber-100">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{q.client?.name}</div>
                  <div className="text-xs text-amber-600">{daysSince(q.sent_at)} dana bez odgovora</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{(q.total||0).toLocaleString('sr-RS')} RSD</div>
                  <div className="text-xs text-blue-600">Pošalji podsetnik ›</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-gray-900">Nedavne ponude</span>
          <Link href="/quotes" className="text-blue-600 text-sm">Sve →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">Još nema ponuda</div>
        ) : (
          recent.map((q: any) => (
            <Link key={q.id} href={`/quotes/${q.id}`}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{q.client?.name || '—'}</div>
                <div className="text-xs text-gray-400">{q.quote_number} · {new Date(q.created_at).toLocaleDateString('sr-RS')}</div>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="font-bold text-sm">{(q.total||0).toLocaleString('sr-RS')}<span className="text-gray-400 font-normal"> RSD</span></span>
                <StatusBadge status={q.status} small />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
