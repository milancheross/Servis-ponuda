'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const ACTIVITY_TYPES = [
  { value: 'poziv', label: '📞 Poziv' },
  { value: 'sastanak', label: '🤝 Sastanak' },
  { value: 'beleska', label: '📝 Beleška' },
]

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' })
  const [activities, setActivities] = useState<any[]>([])
  const [actForm, setActForm] = useState({ type: 'poziv', note: '', activity_date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingAct, setAddingAct] = useState(false)

  async function loadData() {
    const [cRes, aRes] = await Promise.all([
      fetch(`/api/clients/${id}`),
      fetch(`/api/clients/${id}/activities`),
    ])
    if (cRes.ok) {
      const c = await cRes.json()
      setClient(c)
      setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })
    }
    if (aRes.ok) setActivities(await aRes.json())
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/clients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { const c = await res.json(); setClient(c); setEditing(false) }
    setSaving(false)
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    setAddingAct(true)
    const res = await fetch(`/api/clients/${id}/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(actForm) })
    if (res.ok) {
      const a = await res.json()
      setActivities(prev => [a, ...prev])
      setActForm({ type: 'poziv', note: '', activity_date: new Date().toISOString().split('T')[0] })
    }
    setAddingAct(false)
  }

  async function deleteActivity(actId: string) {
    const res = await fetch(`/api/clients/${id}/activities/${actId}`, { method: 'DELETE' })
    if (res.ok) setActivities(prev => prev.filter(a => a.id !== actId))
  }

  if (loading) return <div className="p-4 md:p-8"><div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" /><div className="h-40 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!client) return <div className="p-4">Klijent nije pronađen</div>

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/clients" className="text-gray-500 hover:text-gray-700">← Nazad</Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">{client.name}</h1>
        {!editing && <button onClick={() => setEditing(true)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium">✏️ Izmeni</button>}
      </div>

      {editing ? (
        <form onSubmit={saveEdit} className="bg-white rounded-xl p-4 space-y-3 mb-6 border border-gray-200">
          {[{ label: 'Ime / Naziv firme *', key: 'name', type: 'text', required: true }, { label: 'Telefon', key: 'phone', type: 'tel' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Adresa', key: 'address', type: 'text' }].map(({ label, key, type, required }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input required={required} type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">{saving ? 'Čuvanje...' : 'Sačuvaj'}</button>
            <button type="button" onClick={() => { setEditing(false); setForm({ name: client.name, phone: client.phone || '', email: client.email || '', address: client.address || '' }) }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">Otkaži</button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 space-y-3">
          {[{ label: 'Telefon', value: client.phone }, { label: 'Email', value: client.email }, { label: 'Adresa', value: client.address }].map(({ label, value }) => value ? (
            <div key={label}><div className="text-xs text-gray-400 uppercase font-medium">{label}</div><div className="text-gray-900 mt-0.5">{value}</div></div>
          ) : null)}
          <Link href={`/quotes/new?client=${id}`} className="block w-full text-center bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold mt-4">+ Nova ponuda za ovog klijenta</Link>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">CRM aktivnosti</h2>
        <form onSubmit={addActivity} className="bg-white rounded-xl p-4 mb-4 border border-gray-200 space-y-3">
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map(t => (
              <button type="button" key={t.value} onClick={() => setActForm(f => ({ ...f, type: t.value }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${actForm.type === t.value ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <textarea value={actForm.note} onChange={e => setActForm(f => ({ ...f, note: e.target.value }))} placeholder="Beleška..." rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] resize-none" />
          <div className="flex gap-3 items-center">
            <input type="date" value={actForm.activity_date} onChange={e => setActForm(f => ({ ...f, activity_date: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            <button type="submit" disabled={addingAct} className="flex-1 bg-[#1e3a8a] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
              {addingAct ? 'Dodavanje...' : 'Dodaj'}
            </button>
          </div>
        </form>
        {activities.length === 0 ? (
          <div className="text-center text-gray-400 py-6 text-sm">Još nema aktivnosti</div>
        ) : (
          <div className="space-y-2">
            {activities.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-3">
                <span className="text-xl">{ACTIVITY_TYPES.find(t => t.value === a.type)?.label.split(' ')[0] || '📝'}</span>
                <div className="flex-1"><div className="text-xs text-gray-400 font-medium uppercase">{a.type} · {a.activity_date}</div>{a.note && <div className="text-gray-800 text-sm mt-0.5">{a.note}</div>}</div>
                <button onClick={() => deleteActivity(a.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
