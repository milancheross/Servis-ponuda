'use client'

import { useState, useEffect } from 'react'
import EmptyState from '@/components/EmptyState'

type Category = 'rad' | 'materijal' | 'ostalo'
const CATS = [{ value: '', label: 'Sve' }, { value: 'rad', label: 'Rad' }, { value: 'materijal', label: 'Materijal' }, { value: 'ostalo', label: 'Ostalo' }]
const CAT_COLORS: Record<string, string> = { rad: 'bg-blue-100 text-blue-700', materijal: 'bg-orange-100 text-orange-700', ostalo: 'bg-gray-100 text-gray-600' }

export default function PriceItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [cat, setCat] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState({ name: '', unit: 'kom', price: '', category: 'ostalo' as Category })
  const [saving, setSaving] = useState(false)

  async function load() {
    const url = cat ? `/api/price-items?all=true&category=${cat}` : '/api/price-items?all=true'
    const r = await fetch(url, { credentials: 'include' })
    const d = await r.json()
    setItems(d.items || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [cat])

  function openCreate() { setEditItem(null); setForm({ name: '', unit: 'kom', price: '', category: 'ostalo' }); setShowForm(true) }
  function openEdit(item: any) { setEditItem(item); setForm({ name: item.name, unit: item.unit, price: String(item.price), category: item.category }); setShowForm(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const body = { ...form, price: Number(form.price) }
    if (editItem) await fetch(`/api/price-items/${editItem.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    else await fetch('/api/price-items', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowForm(false); setSaving(false); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Obrisati stavku?')) return
    await fetch(`/api/price-items/${id}`, { method: 'DELETE', credentials: 'include' })
    setItems(p => p.filter(i => i.id !== id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cenovnik</h1>
        <button onClick={openCreate} className="bg-[#2563EB] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700">+ Nova stavka</button>
      </div>
      <div className="flex gap-2 mb-6">
        {CATS.map(c => <button key={c.value} onClick={() => setCat(c.value)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${cat === c.value ? 'bg-[#2563EB] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{c.label}</button>)}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold mb-4">{editItem ? 'Izmeni stavku' : 'Nova stavka'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Naziv *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Jedinica *</label><input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Cena (RSD) *</label><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Kategorija</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="rad">Rad</option><option value="materijal">Materijal</option><option value="ostalo">Ostalo</option></select></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">{saving ? 'Čuvanje...' : 'Sačuvaj'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-5 py-2 rounded-lg text-sm border border-gray-300">Otkaži</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-10 text-gray-400 text-sm">Učitavanje...</div>
        : items.length === 0 ? <EmptyState icon="💰" title="Nema stavki" message="Dodajte usluge i materijale" />
        : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Kategorija</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Naziv</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Jedinica</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">Cena</th>
                <th className="px-6 py-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CAT_COLORS[item.category] || ''}`}>{item.category}</span></td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 text-right font-semibold">{item.price.toLocaleString('sr-RS')} RSD</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 text-xs mr-3">Izmeni</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 text-xs">Obriši</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
