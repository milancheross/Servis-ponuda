'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'

interface Client { id: string; name: string; phone?: string; email?: string; address?: string }

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const r = await fetch('/api/clients', { credentials: 'include' })
    const d = await r.json()
    setClients(d.clients || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    !search || [c.name, c.phone, c.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/clients', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', phone: '', email: '', address: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="sticky top-14 md:top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Klijenti</h1>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Pretraži..."
            className="w-full mt-2 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-3">
        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-blue-200 p-4 mb-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Novi klijent</h2>
            <div className="space-y-3">
              {[{ k: 'name', p: 'Ime i prezime *', req: true, t: 'text' }, { k: 'phone', p: 'Telefon', req: false, t: 'tel' }, { k: 'email', p: 'Email', req: false, t: 'email' }, { k: 'address', p: 'Adresa', req: false, t: 'text' }].map(({ k, p, req, t }) => (
                <input key={k} type={t} placeholder={p} required={req}
                  value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base" />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving}
                className="flex-1 bg-[#2563EB] text-white rounded-xl py-3 font-bold disabled:opacity-60">
                {saving ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold">Otkaži</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="Nema klijenata" message="Dodajte prvog klijenta" />
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-base shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="flex gap-3 mt-0.5">
                      {c.phone && <span className="text-sm text-gray-500">{c.phone}</span>}
                      {c.email && <span className="text-sm text-gray-400 truncate">{c.email}</span>}
                    </div>
                  </div>
                  <div className="ml-auto text-gray-300 text-xl">›</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="fixed bottom-20 md:bottom-6 right-4 bg-[#2563EB] text-white rounded-2xl px-5 py-4 font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2 z-30">
          <span className="text-lg">+</span> Novi klijent
        </button>
      )}
    </div>
  )
}
