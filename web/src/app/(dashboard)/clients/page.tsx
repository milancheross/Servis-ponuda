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
    [c.name, c.phone, c.email].some(v => v?.toLowerCase().includes(search.toLowerCase()))
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

  async function handleDelete(id: string) {
    if (!confirm('Obrisati klijenta?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE', credentials: 'include' })
    setClients(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Klijenti</h1>
        <button onClick={() => setShowForm(true)} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700">
          + Novi klijent
        </button>
      </div>

      <input type="search" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Pretraži po imenu, telefonu, emailu..."
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Novi klijent</h2>
          <div className="grid grid-cols-2 gap-4">
            {[{ key: 'name', label: 'Ime *', required: true }, { key: 'phone', label: 'Telefon' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Adresa' }].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">{saving ? 'Čuvanje...' : 'Sačuvaj'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-5 py-2 rounded-lg text-sm border border-gray-300">Otkaži</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : filtered.length === 0 ? <EmptyState icon="👥" title="Nema klijenata" message="Dodajte prvog klijenta" />
        : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Ime</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Telefon</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Email</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900"><Link href={`/clients/${c.id}`} className="hover:text-blue-600">{c.name}</Link></td>
                    <td className="px-6 py-4 text-gray-500">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{c.email || '—'}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-xs">Obriši</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
