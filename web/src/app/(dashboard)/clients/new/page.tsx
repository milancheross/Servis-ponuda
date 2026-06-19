'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Greška'); setSaving(false); return }
    router.push(`/clients/${data.id}`)
  }

  return (
    <div className="p-4 md:p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">← Nazad</Link>
        <h1 className="text-xl font-bold text-gray-900">Novi klijent</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ime / Naziv firme *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresa</label>
          <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-[#1e3a8a] text-white py-4 rounded-xl font-semibold text-base disabled:opacity-50">
          {saving ? 'Čuvanje...' : 'Sačuvaj klijenta'}
        </button>
      </form>
    </div>
  )
}
