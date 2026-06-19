'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.client) {
          setClient(d.client)
          setForm({ name: d.client.name, phone: d.client.phone || '', email: d.client.email || '', address: d.client.address || '' })
        }
        setLoading(false)
      })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const r = await fetch(`/api/clients/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await r.json()
    if (r.ok) { setClient(d.client); setEditMode(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Obrisati klijenta "${client?.name}"? Ovo neće obrisati ponude i fakture.`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE', credentials: 'include' })
    router.push('/clients')
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Učitavanje...</div>
  if (!client) return <div className="p-6 text-gray-400 text-sm">Klijent nije pronađen</div>

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-4 hover:underline">← Nazad</button>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-400 text-xs mt-0.5">Klijent</p>
        </div>
        {!editMode && (
          <button onClick={() => setEditMode(true)}
            className="border border-blue-500 text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50">
            ✏️ Izmeni
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
          ✓ Podaci su sačuvani
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900 mb-1">Izmeni podatke</h2>
          {[
            { key: 'name', label: 'Ime *', required: true, type: 'text', placeholder: 'Ime klijenta' },
            { key: 'phone', label: 'Telefon', required: false, type: 'tel', placeholder: '+381 6x xxx xxxx' },
            { key: 'email', label: 'Email', required: false, type: 'email', placeholder: 'email@primer.com' },
            { key: 'address', label: 'Adresa', required: false, type: 'text', placeholder: 'Ulica i broj, Grad' },
          ].map(({ key, label, required, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required={required}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 bg-[#2563EB] text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60">
              {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
            </button>
            <button type="button" onClick={() => { setEditMode(false); setForm({ name: client.name, phone: client.phone || '', email: client.email || '', address: client.address || '' }) }}
              className="px-5 py-2.5 rounded-lg text-sm border border-gray-300 text-gray-600">Otkaži</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          {[
            { label: 'Ime', value: client.name, icon: '👤' },
            { label: 'Telefon', value: client.phone, icon: '📞' },
            { label: 'Email', value: client.email, icon: '✉️' },
            { label: 'Adresa', value: client.address, icon: '📍' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-0">
              <span className="text-lg shrink-0">{icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">Nije uneto</span>}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editMode && (
        <button onClick={handleDelete}
          className="w-full border border-red-200 text-red-500 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
          Obriši klijenta
        </button>
      )}
    </div>
  )
}
