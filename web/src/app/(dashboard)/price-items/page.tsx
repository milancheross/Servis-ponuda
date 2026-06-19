'use client'

import { useEffect, useState } from 'react'

const CATEGORIES = [
  { value: 'rad', label: '🔧 Rad' },
  { value: 'materijal', label: '📦 Materijal' },
  { value: 'ostalo', label: '➕ Ostalo' },
]

export default function PriceItemsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', unit: 'kom', price: '', category: 'rad' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', unit: '', price: '', category: '' })

  useEffect(() => {
    fetch('/api/price-items').then(r => r.json()).then(d => { setItems(d || []); setLoading(false) })
  }, [])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/price-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })
    if (res.ok) {
      const item = await res.json()
      setItems(prev => [...prev, item])
      setForm({ name: '', unit: 'kom', price: '', category: 'rad' })
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/price-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, price: parseFloat(editForm.price) }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
      setEditId(null)
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/price-items/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Cenovnik</h1>
        <button onClick={() => setShowAdd(true)} className="hidden md:inline-flex bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Dodaj stavku
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addItem} className="bg-white border-2 border-[#1e3a8a] rounded-xl p-4 mb-6 space-y-3">
          <div className="font-semibold text-gray-800 mb-1">Nova stavka</div>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Naziv (npr. Čišćenje klime)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
          <div className="flex gap-2">
            <input required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              type="number" placeholder="Cena (RSD)" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            <input required value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="jed." className="w-24 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Dodavanje...' : 'Dodaj stavku'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">Otkaži</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💰</div>
          <div className="font-medium mb-4">Cenovnik je prazan</div>
          <button onClick={() => setShowAdd(true)} className="bg-[#1e3a8a] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            Dodaj prvu stavku
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const catItems = grouped[cat.value]
            if (!catItems?.length) return null
            return (
              <div key={cat.value}>
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">{cat.label}</div>
                <div className="space-y-2">
                  {catItems.map((item: any) => (
                    <div key={item.id}>
                      {editId === item.id ? (
                        <div className="bg-white border-2 border-[#1e3a8a] rounded-xl p-3 space-y-2">
                          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                          <div className="flex gap-2">
                            <input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                            <input value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
                              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(item.id)} className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg text-sm font-semibold">Sačuvaj</button>
                            <button onClick={() => setEditId(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold">Otkaži</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{item.price.toLocaleString('sr-RS')} RSD / {item.unit}</div>
                          </div>
                          <button onClick={() => { setEditId(item.id); setEditForm({ name: item.name, unit: item.unit, price: String(item.price), category: item.category }) }}
                            className="text-gray-400 hover:text-[#1e3a8a] text-sm px-2 py-1">✏️</button>
                          <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 text-sm px-2 py-1">🗑️</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => setShowAdd(true)} className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center text-2xl shadow-lg z-30">
        +
      </button>
    </div>
  )
}
