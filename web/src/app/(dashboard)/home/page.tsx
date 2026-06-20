'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { Quote } from '@/lib/types'

function fmt(n: number) {
  return (n || 0).toLocaleString('sr-RS') + ' RSD'
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

interface Stats {
  clientCount: number
  quotesThisMonth: number
  unpaidCount: number
  unpaidTotal: number
  reminders: Array<{ id: string; quote_number: string; total: number; sent_at: string; client: { name: string } | null }>
  recentQuotes: Quote[]
}

function OnboardingChecklist({ stats }: { stats: Stats }) {
  const hasClients = stats.clientCount > 0
  const hasQuote = stats.quotesThisMonth > 0 || stats.recentQuotes.length > 0

  if (hasClients && hasQuote) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
      <div className="font-bold text-[#1e3a8a] mb-3">Dobrodošli! Napravite prvu ponudu za 3 koraka:</div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${true ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>✓</div>
          <span className={`text-sm ${true ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>Kreiran nalog</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${hasClients ? 'bg-green-500 text-white' : 'bg-[#1e3a8a] text-white'}`}>
            {hasClients ? '✓' : '2'}
          </div>
          {hasClients ? (
            <span className="text-sm line-through text-gray-400">Dodat klijent</span>
          ) : (
            <Link href="/clients/new" className="text-sm font-semibold text-[#1e3a8a] underline underline-offset-2">
              Dodaj prvog klijenta →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${hasQuote ? 'bg-green-500 text-white' : hasClients ? 'bg-[#1e3a8a] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {hasQuote ? '✓' : '3'}
          </div>
          {hasQuote ? (
            <span className="text-sm line-through text-gray-400">Kreirana ponuda</span>
          ) : hasClients ? (
            <Link href="/quotes/new" className="text-sm font-semibold text-[#1e3a8a] underline underline-offset-2">
              Napravi prvu ponudu →
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Napravi prvu ponudu</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    async function load() {
      const [profileRes, statsRes] = await Promise.all([
        fetch('/api/auth/profile'),
        fetch('/api/dashboard/stats'),
      ])
      const profile = profileRes.ok ? await profileRes.json() : null
      const statsData = statsRes.ok ? await statsRes.json() : null

      if (profile?.user) setCompanyName(profile.user.company_name || '')
      if (statsData) setStats(statsData)
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

  const s = stats || { clientCount: 0, quotesThisMonth: 0, unpaidCount: 0, unpaidTotal: 0, reminders: [], recentQuotes: [] }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto md:max-w-none">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{companyName || 'Dobrodošli'}</h1>
          <p className="text-gray-500 text-sm mt-0.5 capitalize">{today}</p>
        </div>
        <Link href="/quotes/new"
          className="hidden md:flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-900 transition-colors">
          + Nova ponuda
        </Link>
      </div>

      <OnboardingChecklist stats={s} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/clients" className="bg-[#1e3a8a] text-white rounded-xl p-4 hover:bg-blue-900 transition-colors">
          <div className="text-3xl font-bold">{s.clientCount}</div>
          <div className="text-blue-200 text-sm mt-1">Klijenata ukupno</div>
        </Link>
        <Link href="/quotes" className="bg-[#1e3a8a] text-white rounded-xl p-4 hover:bg-blue-900 transition-colors">
          <div className="text-3xl font-bold">{s.quotesThisMonth}</div>
          <div className="text-blue-200 text-sm mt-1">Ponuda ovaj mesec</div>
        </Link>
        <Link href="/invoices" className="bg-white rounded-xl p-4 border-2 border-orange-200 hover:border-orange-400 transition-colors">
          <div className="text-2xl font-bold text-orange-600">{s.unpaidCount}</div>
          <div className="text-gray-500 text-sm mt-1">Neplaćenih faktura</div>
        </Link>
        <Link href="/invoices" className="bg-white rounded-xl p-4 border-2 border-orange-200 hover:border-orange-400 transition-colors">
          <div className="text-lg font-bold text-orange-600 leading-tight">{fmt(s.unpaidTotal)}</div>
          <div className="text-gray-500 text-sm mt-1">Čeka naplatu</div>
        </Link>
      </div>

      {s.reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="font-semibold text-amber-800 mb-2">⏰ Podsetnici ({s.reminders.length}) — ponude čekaju odgovor &gt;7 dana</div>
          <div className="space-y-2">
            {s.reminders.map(q => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between bg-white rounded-lg p-3 hover:bg-amber-50 transition-colors">
                <div>
                  <div className="font-medium text-sm text-gray-900">{q.client?.name || 'Klijent'}</div>
                  <div className="text-xs text-gray-500">{q.quote_number} · {fmt(q.total)}</div>
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
        {s.recentQuotes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-2">📋</div>
            <div>Još nema ponuda</div>
            <Link href="/quotes/new" className="mt-3 inline-block bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium">
              Napravi prvu ponudu
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {s.recentQuotes.map(q => (
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

      {/* Mobile FAB */}
      <Link href="/quotes/new"
        className="md:hidden fixed bottom-20 right-4 z-30 bg-[#1e3a8a] text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-blue-900/30">
        +
      </Link>
    </div>
  )
}
