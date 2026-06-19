'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'

export default function DashboardPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/quotes', { credentials: 'include' }).then(r => r.json()).then(d => setQuotes(d.quotes || []))
    fetch('/api/invoices', { credentials: 'include' }).then(r => r.json()).then(d => setInvoices(d.invoices || []))
  }, [])

  const now = new Date()
  const thisMonth = quotes.filter(q => new Date(q.created_at).getMonth() === now.getMonth())
  const totalValue = thisMonth.reduce((s: number, q: any) => s + (q.total || 0), 0)
  const accepted = quotes.filter(q => q.status === 'prihvacena').length
  const unpaid = invoices.filter(i => i.status === 'neplaceno').length
  const recent = quotes.slice(0, 5)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dobrodošli, {user?.company_name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Pregled vaše aktivnosti</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ponude ovog meseca', value: thisMonth.length, icon: '📋' },
          { label: 'Ukupna vrednost', value: `${totalValue.toLocaleString('sr-RS')} RSD`, icon: '💰' },
          { label: 'Prihvaćene ponude', value: accepted, icon: '✅' },
          { label: 'Neplaćene fakture', value: unpaid, icon: '🧾' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Link href="/quotes/new" className="bg-[#2563EB] text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
          + Nova ponuda
        </Link>
        <Link href="/clients" className="bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors">
          Novi klijent
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Nedavne ponude</h2>
          <Link href="/quotes" className="text-blue-600 text-sm hover:underline">Sve ponude →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Još nema ponuda</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Klijent</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Datum</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Iznos</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map((q: any) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <Link href={`/quotes/${q.id}`} className="hover:text-blue-600">{q.client?.name || '—'}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(q.created_at).toLocaleDateString('sr-RS')}</td>
                  <td className="px-6 py-4 text-right font-semibold">{(q.total || 0).toLocaleString('sr-RS')} RSD</td>
                  <td className="px-6 py-4 text-right"><StatusBadge status={q.status} small /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
