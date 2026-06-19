'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Client { id: string; name: string; phone?: string }
interface PriceItem { id: string; name: string; unit: string; price: number; category: string }
interface Item { name: string; unit: string; quantity: number; price: number; category: string }

export default function NewQuotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [discount, setDiscount] = useState(0)
  const [note, setNote] = useState('')
  const [manual, setManual] = useState<Item>({ name: '', unit: 'kom', quantity: 1, price: 0, category: 'ostalo' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/clients', { credentials: 'include' }).then(r => r.json()).then(d => setClients(d.clients || []))
    fetch('/api/price-items', { credentials: 'include' }).then(r => r.json()).then(d => setPriceItems(d.items || []))
  }, [])

  const filtered = clients.filter(c => [c.name, c.phone].some(v => v?.toLowerCase().includes(clientSearch.toLowerCase())))
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0)
  const total = subtotal * (1 - discount / 100)

  function addPriceItem(pi: PriceItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.name === pi.name)
      if (idx >= 0) return prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { name: pi.name, unit: pi.unit, quantity: 1, price: pi.price, category: pi.category || 'ostalo' }]
    })
  }

  async function handleSave(send: boolean) {
    if (!selectedClient) return
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/quotes', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClient.id, items, discount_percent: discount, note }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      if (send) await fetch(`/api/quotes/${d.quote.id}/send`, { method: 'POST', credentials: 'include' })
      router.push(`/quotes/${d.quote.id}`)
    } catch (e: any) { setError(e.message); setSaving(false) }
  }

  const CAT_COLORS: Record<string, string> = { rad: 'text-blue-600', materijal: 'text-orange-600', ostalo: 'text-gray-500' }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-blue-600 text-sm hover:underline">← Nazad</button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nova ponuda</h1>
      </div>

      {/* Steps */}
      <div className="flex gap-2 mb-6">
        {['Klijent', 'Stavke', 'Pregled'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 md:w-8 h-px bg-gray-300" />}
            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium ${
              step === i+1 ? 'bg-[#2563EB] text-white' : step > i+1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}>{i+1}. {s}</div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Odaberi klijenta</h2>
          <input type="search" value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Pretraži..." className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm mb-4" />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedClient(c)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  selectedClient?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <div className="font-medium">{c.name}</div>
                {c.phone && <div className="text-xs text-gray-500">{c.phone}</div>}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={!selectedClient} className="mt-5 w-full bg-[#2563EB] text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-40">Dalje: Stavke →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {priceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Iz cenovnika</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                {priceItems.map(pi => (
                  <button key={pi.id} onClick={() => addPriceItem(pi)}
                    className="text-left px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <div className="text-sm font-medium">{pi.name}</div>
                    <div className="text-xs mt-0.5">
                      <span className={`font-medium ${CAT_COLORS[pi.category] || ''}`}>{pi.category}</span>
                      <span className="text-gray-400 ml-2">{pi.price.toLocaleString('sr-RS')} RSD/{pi.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Dodaj ručno</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} placeholder="Naziv" className="col-span-2 border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                <input value={manual.unit} onChange={e => setManual(m => ({ ...m, unit: e.target.value }))} placeholder="Jed. (kom, m2...)" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                <input type="number" value={manual.quantity} onChange={e => setManual(m => ({ ...m, quantity: Number(e.target.value) }))} placeholder="Količina" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={manual.price || ''} onChange={e => setManual(m => ({ ...m, price: Number(e.target.value) }))} placeholder="Cena (RSD)" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm" />
                <select value={manual.category} onChange={e => setManual(m => ({ ...m, category: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm">
                  <option value="rad">Rad</option>
                  <option value="materijal">Materijal</option>
                  <option value="ostalo">Ostalo</option>
                </select>
              </div>
              <button onClick={() => { if (manual.name && manual.price > 0) { setItems(p => [...p, { ...manual }]); setManual({ name: '', unit: 'kom', quantity: 1, price: 0, category: 'ostalo' }) } }}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200">+ Dodaj stavku</button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold mb-3">Odabrane stavke ({items.length})</h2>
              <div className="space-y-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.quantity} × {item.price.toLocaleString('sr-RS')} RSD • <span className={CAT_COLORS[item.category] || ''}>{item.category}</span></div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-sm font-semibold">{(item.quantity*item.price).toLocaleString('sr-RS')} RSD</span>
                      <button onClick={() => setItems(p => p.filter((_,i) => i !== idx))} className="text-red-400 text-lg">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Popust (%)</label>
                  <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min={0} max={100} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Napomena</label>
                  <input value={note} onChange={e => setNote(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-5 py-3 border border-gray-300 rounded-lg text-sm text-gray-600">← Nazad</button>
            <button onClick={() => setStep(3)} disabled={items.length === 0} className="flex-1 bg-[#2563EB] text-white rounded-lg py-3 font-semibold text-sm disabled:opacity-40">Pregled →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-semibold mb-5">Pregled ponude</h2>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Klijent</div>
            <div className="font-semibold">{selectedClient?.name}</div>
          </div>
          <div className="space-y-1 mb-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50">
                <div>
                  <div className="font-medium">{item.name} <span className={`text-xs ${CAT_COLORS[item.category] || ''}`}>({item.category})</span></div>
                  <div className="text-xs text-gray-400">{item.quantity} {item.unit}</div>
                </div>
                <span className="font-medium shrink-0 ml-2">{(item.quantity*item.price).toLocaleString('sr-RS')} RSD</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Osnovica:</span><span>{subtotal.toLocaleString('sr-RS')} RSD</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-red-600"><span>Popust ({discount}%):</span><span>-{(subtotal*discount/100).toLocaleString('sr-RS')} RSD</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>UKUPNO:</span><span>{total.toLocaleString('sr-RS')} RSD</span></div>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mt-4">{error}</div>}
          <div className="flex gap-3 mt-5">
            <button onClick={() => setStep(2)} className="px-5 py-3 border border-gray-300 rounded-lg text-sm text-gray-600">← Nazad</button>
            <button onClick={() => handleSave(false)} disabled={saving} className="flex-1 border border-blue-500 text-blue-600 rounded-lg py-3 text-sm font-semibold disabled:opacity-60">{saving ? '...' : 'Sačuvaj nacrt'}</button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex-1 bg-[#2563EB] text-white rounded-lg py-3 text-sm font-semibold disabled:opacity-60">{saving ? '...' : '📤 Pošalji'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
