'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${id}`, { credentials: 'include' }).then(r => r.json()).then(d => {
      if (d.client) setForm({ name: d.client.name, phone: d.client.phone || '', email: d.client.email || '', address: d.client.address || '' })
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/clients/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setMsg('Sačuvano!')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Učitavanje...</div>

  return (
    <div className="p-6 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-6 hover:underline">← Nazad</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{form.name}</h1>
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        {[{ key: 'name', label: 'Ime *', required: true }, { key: 'phone', label: 'Telefon' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Adresa' }].map(({ key, label, required }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={required}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        {msg && <div className="text-green-600 text-sm">{msg}</div>}
        <button type="submit" disabled={saving} className="w-full bg-[#2563EB] text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-60">
          {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
        </button>
      </form>
    </div>
  )
}
