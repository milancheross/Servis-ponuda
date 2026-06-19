'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Client { id: string; name: string; phone?: string }
interface PriceItem { id: string; name: string; unit: string; price: number; category: string }
interface Item { name: string; unit: string; quantity: number; price: number; category: string }

const CAT = [
  { value: 'rad', label: 'Rad', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'materijal', label: 'Materijal', color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'ostalo', label: 'Ostalo', color: 'border-gray-300 bg-gray-50 text-gray-600' },
]

export default function NewQuotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<Client[]>([])
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [discount, setDiscount] = useState(0)
  const [note, setNote] = useState('')
  const [manual, setManual] = useState<Item>({ name: '', unit: 'kom', quantity: 1, price: 0, category: 'rad' })
  const [showManual, setShowManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/clients', { credentials: 'include' }).then(r => r.json()).then(d => setClients(d.clients || []))
    fetch('/api/price-items', { credentials: 'include' }).then(r => r.json()).then(d => setPriceItems(d.items || []))
  }, [])

  const filtered = clients.filter(c =>
    !search || [c.name, c.phone].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )
  const subtotal = items.reduce((s, i) => s + i.quantity * i.price, 0)
  const total = subtotal * (1 - discount / 100)
  const laborTotal = items.filter(i => i.category === 'rad').reduce((s, i) => s + i.quantity * i.price, 0)
  const materialTotal = items.filter(i => i.category === 'materijal').reduce((s, i) => s + i.quantity * i.price, 0)

  function addPriceItem(pi: PriceItem) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.name === pi.name)
      if (idx >= 0) return prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { name: pi.name, unit: pi.unit, quantity: 1, price: pi.price, category: pi.category || 'ostalo' }]
    })
  }

  function updateQty(idx: number, delta: number) {
    setItems(prev => prev.map((i, j) => j === idx
      ? { ...i, quantity: Math.max(0.5, Math.round((i.quantity + delta) * 10) / 10 ) }
      : i
    ))
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
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

  const STEP_LABELS = ['Klijent', 'Stavke', 'Pregled']

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Sticky header */}
      <div className="sticky top-14 md:top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="text-blue-600 text-sm font-medium">←</button>
          <div className="flex-1 flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 ${
                  step === i+1 ? 'text-blue-600' : step > i+1 ? 'text-green-600' : 'text-gray-300'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === i+1 ? 'bg-blue-600 text-white' :
                    step > i+1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>{step > i+1 ? '✓' : i+1}</div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px mx-1 ${step > i+1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">

        {/* KORAK 1 — KLIJENT */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Odaberi klijenta</h1>
            <input
              type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži po imenu ili telefonu..."
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-4 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-sm">Nema klijenata. <button onClick={() => router.push('/clients')} className="text-blue-600 underline">Dodaj klijenta</button></div>
              </div>
            )}
            <div className="space-y-2">
              {filtered.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setStep(2) }}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                    selectedClient?.id === c.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  {c.phone && <div className="text-sm text-gray-500 mt-0.5">📞 {c.phone}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KORAK 2 — STAVKE */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Stavke</h1>
              {items.length > 0 && (
                <div className="text-sm font-bold text-blue-600">{total.toLocaleString('sr-RS')} RSD</div>
              )}
            </div>

            {/* Cenovnik */}
            {priceItems.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Iz cenovnika</div>
                {['rad', 'materijal', 'ostalo'].map(cat => {
                  const catItems = priceItems.filter(p => p.category === cat)
                  if (!catItems.length) return null
                  const catInfo = CAT.find(c => c.value === cat)!
                  return (
                    <div key={cat} className="mb-3">
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2 ${catInfo.color}`}>{catInfo.label}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {catItems.map(pi => {
                          const inCart = items.find(i => i.name === pi.name)
                          return (
                            <button key={pi.id} onClick={() => addPriceItem(pi)}
                              className={`text-left p-3 rounded-xl border-2 transition-all ${
                                inCart ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                              }`}>
                              <div className="text-sm font-medium text-gray-900 leading-tight">{pi.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{pi.price.toLocaleString('sr-RS')} /{pi.unit}</div>
                              {inCart && <div className="text-xs text-blue-600 font-bold mt-1">✓ {inCart.quantity}x</div>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Rucno dodavanje */}
            <button onClick={() => setShowManual(s => !s)}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors mb-4">
              {showManual ? '− Zatvori' : '+ Dodaj ručno'}
            </button>

            {showManual && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
                <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                  placeholder="Naziv stavke" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" inputMode="decimal" value={manual.price || ''} onChange={e => setManual(m => ({ ...m, price: Number(e.target.value) }))}
                    placeholder="Cena (RSD)" className="border border-gray-300 rounded-xl px-4 py-3 text-base" />
                  <input value={manual.unit} onChange={e => setManual(m => ({ ...m, unit: e.target.value }))}
                    placeholder="Jed. (kom, m²...)" className="border border-gray-300 rounded-xl px-4 py-3 text-base" />
                </div>
                <div className="flex gap-2">
                  {CAT.map(c => (
                    <button key={c.value} type="button" onClick={() => setManual(m => ({ ...m, category: c.value }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        manual.category === c.value ? c.color + ' border-current' : 'border-gray-200 text-gray-400'
                      }`}>{c.label}</button>
                  ))}
                </div>
                <button onClick={() => {
                  if (manual.name && manual.price > 0) {
                    setItems(p => [...p, { ...manual }])
                    setManual({ name: '', unit: 'kom', quantity: 1, price: 0, category: 'rad' })
                    setShowManual(false)
                  }
                }} className="w-full bg-gray-900 text-white rounded-xl py-3 font-semibold text-sm">Dodaj stavku</button>
              </div>
            )}

            {/* Lista odabranih stavki */}
            {items.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
                  <span className="font-semibold text-gray-900">Odabrane stavke</span>
                  <span className="text-xs text-gray-400">{items.length} stavki</span>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.price.toLocaleString('sr-RS')} RSD/{item.unit}</div>
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 text-xl ml-3 shrink-0">×</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQty(idx, -1)} className="w-9 h-9 rounded-full border-2 border-gray-300 text-gray-600 font-bold text-lg flex items-center justify-center hover:border-blue-400">-</button>
                        <span className="text-base font-bold w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-9 h-9 rounded-full border-2 border-blue-500 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-50">+</button>
                      </div>
                      <span className="font-bold text-gray-900">{(item.quantity * item.price).toLocaleString('sr-RS')} RSD</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 shrink-0">Popust:</label>
                    <input type="number" inputMode="decimal" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))}
                      placeholder="0" min={0} max={100}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center" />
                    <span className="text-sm text-gray-500">%</span>
                    <span className="ml-auto font-bold text-blue-600">{total.toLocaleString('sr-RS')} RSD</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Napomena za klijenta (opciono)..." rows={2}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base resize-none" />
            </div>
          </div>
        )}

        {/* KORAK 3 — PREGLED */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">Pregled ponude</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Klijent</div>
              <div className="font-bold text-gray-900 text-lg">{selectedClient?.name}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} {item.unit} × {item.price.toLocaleString('sr-RS')} RSD</div>
                  </div>
                  <div className="font-bold text-sm shrink-0 ml-2">{(item.quantity*item.price).toLocaleString('sr-RS')} RSD</div>
                </div>
              ))}
              <div className="px-4 py-3 bg-gray-50 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Osnovica</span><span>{subtotal.toLocaleString('sr-RS')} RSD</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-sm text-red-500"><span>Popust ({discount}%)</span><span>-{(subtotal*discount/100).toLocaleString('sr-RS')} RSD</span></div>}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                  <span>UKUPNO</span><span className="text-blue-600">{total.toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>
            </div>

            {/* Profit breakdown */}
            {(laborTotal > 0 || materialTotal > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">💰 Vaša zarada na projektu</div>
                <div className="space-y-2">
                  {laborTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Zarada od rada</span>
                      <span className="font-bold text-green-700">{laborTotal.toLocaleString('sr-RS')} RSD</span>
                    </div>
                  )}
                  {materialTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vrednost materijala</span>
                      <span className="font-semibold text-gray-700">{materialTotal.toLocaleString('sr-RS')} RSD</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-green-200">
                    <span className="text-green-800">Ukupno naplatiti</span>
                    <span className="text-green-700 text-lg">{total.toLocaleString('sr-RS')} RSD</span>
                  </div>
                  {laborTotal > 0 && total > 0 && (
                    <div className="text-xs text-green-600 text-right">
                      Rad = {Math.round(laborTotal / total * 100)}% prihoda
                    </div>
                  )}
                </div>
              </div>
            )}

            {note && <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 mb-3"><b>Napomena:</b> {note}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-3">{error}</div>}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <button onClick={() => selectedClient && setStep(2)} disabled={!selectedClient}
              className="w-full bg-[#2563EB] text-white rounded-xl py-4 font-bold text-base disabled:opacity-40">
              Dalje: Stavke →
            </button>
          )}
          {step === 2 && (
            <button onClick={() => items.length > 0 && setStep(3)} disabled={items.length === 0}
              className="w-full bg-[#2563EB] text-white rounded-xl py-4 font-bold text-base disabled:opacity-40">
              Pregled ({items.length} stavki) →
            </button>
          )}
          {step === 3 && (
            <div className="flex gap-3">
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex-1 border-2 border-blue-500 text-blue-600 rounded-xl py-4 font-bold text-sm disabled:opacity-60">
                {saving ? '...' : 'Sačuvaj nacrt'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex-1 bg-[#2563EB] text-white rounded-xl py-4 font-bold text-sm disabled:opacity-60">
                {saving ? '...' : '📤 Pošalji klijentu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
