'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function fmt(n: number) {
  return (n || 0).toLocaleString('sr-RS') + ' RSD'
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ clients: 0, quotesThisMonth: 0, unpaidTotal: 0, unpaidCount: 0 })
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function load() {
      const [profileRes, clientsRes, quotesRes, invoicesRes] = await Promise.all([
        fetch('/api/auth/profile'),
        fetch('/api/clients'),
        fetch('/api/quotes'),
        fetch('/api/invoices'),
      ])
      const profile = profileRes.ok ? await profileRes.json() : null
      const clients = clientsRes.ok ? await clientsRes.json() : []
      const quotes = quotesRes.ok ? await quotesRes.json() : []
      const invoices = invoicesRes.ok ? await invoicesRes.json() : []

      if (profile?.user) setCompanyName(profile.user.company_name || '')

      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      const quotesThisMonth = quotes.filter((q: any) => new Date(q.created_at) >= thisMonth).length
      const unpaid = invoices.filter((inv: any) => inv.status === 'neplaceno')
      const unpaidTotal = unpaid.reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)

      setStats({ clients: clients.length, quotesThisMonth, unpaidTotal, unpaidCount: unpaid.length })
      setRecentQuotes(quotes.slice(0, 4))

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
      setReminders(quotes.filter((q: any) => q.status === 'poslata' && q.sent_at && new Date(q.sent_at) < sevenDaysAgo))

      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto md:max-w-none">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{companyName || 'Dobrodošli'}</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1e3a8a] text-white rounded-xl p-4">
          <div className="text-3xl font-bold">{stats.clients}</div>
          <div className="text-blue-200 text-sm mt-1">Klijenata ukupno</div>
        </div>
        <div className="bg-[#1e3a8a] text-white rounded-xl p-4">
          <div className="text-3xl font-bold">{stats.quotesThisMonth}</div>
          <div className="text-blue-200 text-sm mt-1">Ponuda ovaj mesec</div>
        </div>
        <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{stats.unpaidCount}</div>
          <div className="text-gray-500 text-sm mt-1">Neplaćenih faktura</div>
        </div>
        <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
          <div className="text-lg font-bold text-orange-600 leading-tight">{fmt(stats.unpaidTotal)}</div>
          <div className="text-gray-500 text-sm mt-1">Čeka naplatu</div>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="font-semibold text-amber-800 mb-2">⏰ Podsetnici ({reminders.length})</div>
          <div className="space-y-2">
            {reminders.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-white rounded-lg p-3 hover:bg-amber-50 transition-colors">
                <div>
                  <div className="font-medium text-sm text-gray-900">{q.client?.name || 'Klijent'}</div>
                  <div className="text-xs text-gray-500">{q.quote_number}</div>
                </div>
                <div className="text-amber-700 text-xs font-semibold">{daysSince(q.sent_at)} dana</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Poslednje ponude</h2>
          <Link href="/quotes" className="text-[#1e3a8a] text-sm font-medium">Sve →</Link>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <div>Još nema ponuda</div>
            <Link href="/quotes/new" className="mt-3 inline-block bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Napravi prvu ponudu
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentQuotes.map((q: any) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm transition-shadow border border-gray-100">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{q.client?.name || '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{q.quote_number} · {fmt(q.total_amount)}</div>
                </div>
                <StatusBadge status={q.status} small />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
