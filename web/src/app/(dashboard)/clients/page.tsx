'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => { setClients(d || []); setLoading(false) })
  }, [])

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Klijenti</h1>
        <Link href="/clients/new" className="hidden md:inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Novi klijent
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <div className="font-medium">Još nema klijenata</div>
          <Link href="/clients/new" className="mt-4 inline-block bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            Dodaj prvog klijenta
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((c: any) => (
            <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-3 bg-white rounded-xl p-4 hover:shadow-sm transition-shadow border border-gray-100">
              <div className="w-11 h-11 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials(c.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-500 truncate">{c.phone || c.email || '—'}</div>
              </div>
              <span className="text-gray-400">›</span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/clients/new" className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center text-2xl shadow-lg z-30">
        +
      </Link>
    </div>
  )
}
