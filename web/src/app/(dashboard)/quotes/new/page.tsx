'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clientDisplayName } from '@/lib/client-utils'

const CATEGORY_LABELS: Record<string, string> = { rad: '🔧 Rad', materijal: '📦 Materijal', ostalo: '➕ Ostalo' }

interface Item { name: string; unit: string; price: number; quantity: number; category: string }

function BillingSection({
  priceDisplayMode, setPriceDisplayMode,
  paymentTerms, setPaymentTerms,
  paymentTermsNote, setPaymentTermsNote,
  billingNotesSnapshot,
}: {
  priceDisplayMode: string; setPriceDisplayMode: (v: string) => void
  paymentTerms: string; setPaymentTerms: (v: string) => void
  paymentTermsNote: string; setPaymentTermsNote: (v: string) => void
  billingNotesSnapshot: string
}) {
  const [open, setOpen] = useState(false)
  const hasValues = paymentTerms !== 'unknown' || paymentTermsNote || billingNotesSnapshot || priceDisplayMode !== 'total_only'

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plaćanje i prikaz cene</span>
          {hasValues && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">podešeno</span>}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prikaz cene na ponudi</label>
            <select value={priceDisplayMode} onChange={e => setPriceDisplayMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]">
              <option value="total_only">Samo ukupna cena</option>
              <option value="subtotal_vat_total">Osnovica + PDV + ukupno</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rok / uslovi plaćanja</label>
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]">
              <option value="unknown">Nije definisano</option>
              <option value="immediately">Odmah</option>
              <option value="advance">Avansno</option>
              <option value="7_days">7 dana</option>
              <option value="15_days">15 dana</option>
              <option value="30_days">30 dana</option>
              <option value="custom">Po dogovoru</option>
            </select>
          </div>
          {(paymentTerms === 'custom' || paymentTermsNote) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Napomena za plaćanje</label>
              <input value={paymentTermsNote} onChange={e => setPaymentTermsNote(e.target.value)}
                placeholder="npr. 50% avans, ostatak po završetku"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
          )}
          {billingNotesSnapshot && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <div className="text-xs font-bold uppercase text-yellow-600 mb-0.5">Napomena za fakturisanje (iz klijenta)</div>
              {billingNotesSnapshot}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewQuoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')

  const [step, setStep] = useState(1)
  const [clients, setClients] = useState<any[]>([])
  const [priceItems, setPriceItems] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [items, setItems] = useState<Item[]>([])
  const [note, setNote] = useState('')
  const [discount, setDiscount] = useState(0)
  const [clientSearch, setClientSearch] = useState('')
  const [manualItem, setManualItem] = useState({ name: '', unit: 'kom', price: '', category: 'ostalo' })
  const [showManual, setShowManual] = useState(false)
  const [saving, setSaving] = useState(false)

  const [priceDisplayMode, setPriceDisplayMode] = useState('total_only')
  const [paymentTerms, setPaymentTerms] = useState('unknown')
  const [paymentTermsNote, setPaymentTermsNote] = useState('')
  const [billingNotesSnapshot, setBillingNotesSnapshot] = useState('')

  useEffect(() => {
    Promise.all([fetch('/api/clients').then(r => r.json()), fetch('/api/price-items').then(r => r.json())])
      .then(([c, p]) => {
        setClients(c || [])
        setPriceItems(p || [])
        if (preselectedClientId) {
          const found = (c || []).find((x: any) => x.id === preselectedClientId)
          if (found) { applyClientBillingPrefs(found); setSelectedClient(found); setStep(2) }
        }
      })
  }, [preselectedClientId])

  function applyClientBillingPrefs(c: any) {
    if (c.preferred_price_display_mode && c.preferred_price_display_mode !== 'unknown') {
      setPriceDisplayMode(c.preferred_price_display_mode)
    }
    if (c.payment_terms && c.payment_terms !== 'unknown') {
      setPaymentTerms(c.payment_terms)
    }
    if (c.payment_terms_note) setPaymentTermsNote(c.payment_terms_note)
    if (c.billing_notes) setBillingNotesSnapshot(c.billing_notes)
  }

  function selectClient(c: any) {
    setSelectedClient(c)
    applyClientBillingPrefs(c)
    setTimeout(() => setStep(2), 200)
  }

  function getQty(item: any) {
    return items.find(i => i.name === item.name)?.quantity || 0
  }

  function setQty(item: any, delta: number) {
    const existing = items.find(i => i.name === item.name)
    if (existing) {
      const newQty = existing.quantity + delta
      if (newQty <= 0) setItems(prev => prev.filter(i => i.name !== item.name))
      else setItems(prev => prev.map(i => i.name === item.name ? { ...i, quantity: newQty } : i))
    } else if (delta > 0) {
      setItems(prev => [...prev, { name: item.name, unit: item.unit, price: item.price, quantity: 1, category: item.category || 'ostalo' }])
    }
  }

  function addManual() {
    if (!manualItem.name || !manualItem.price) return
    setItems(prev => [...prev, { name: manualItem.name, unit: manualItem.unit, price: parseFloat(manualItem.price), quantity: 1, category: manualItem.category }])
    setManualItem({ name: '', unit: 'kom', price: '', category: 'ostalo' })
    setShowManual(false)
  }

  function removeItem(name: string) {
    setItems(prev => prev.filter(i => i.name !== name))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal * (1 - discount / 100)
  const laborTotal = items.filter(i => i.category === 'rad').reduce((s, i) => s + i.price * i.quantity, 0)
  const materialTotal = items.filter(i => i.category === 'materijal').reduce((s, i) => s + i.price * i.quantity, 0)

  const filteredClients = clients.filter(c => (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()) || (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase()))
  const groupedPriceItems = (priceItems || []).reduce((acc: any, item: any) => {
    const cat = item.category || 'ostalo'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, any[]>)

  async function submit() {
    setSaving(true)
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        items,
        note,
        discount_percent: discount,
        price_display_mode: priceDisplayMode,
        payment_terms: paymentTerms,
        payment_terms_note: paymentTermsNote || null,
        billing_notes_snapshot: billingNotesSnapshot || null,
      }),
    })
    if (res.ok) {
      const q = await res.json()
      router.push(`/quotes/${q.id}`)
    } else {
      setSaving(false)
    }
  }

  const steps = ['Klijent', 'Stavke', 'Pregled']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-14 md:top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-[#1e3a8a] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${i + 1 === step ? 'text-[#1e3a8a]' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full pb-32">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Izaberi klijenta</h2>
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Pretraži klijente..." autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-3 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            <div className="space-y-2">
              {filteredClients.map(c => (
                <button key={c.id} onClick={() => selectClient(c)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedClient?.id === c.id ? 'border-[#1e3a8a] bg-blue-50' : 'border-gray-200 bg-white'
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {clientDisplayName(c)[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{clientDisplayName(c)}</div>
                    <div className="text-sm text-gray-500">{c.phone || c.email || (c.client_type === 'business' ? 'Firma' : '') || '—'}</div>
                  </div>
                </button>
              ))}
              <Link href="/clients/new" className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">+</div>
                <span className="font-medium">Dodaj novog klijenta</span>
              </Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Stavke ponude</h2>
            <p className="text-sm text-gray-500 mb-4">Klijent: <strong>{clientDisplayName(selectedClient)}</strong></p>

            {Object.keys(groupedPriceItems).length > 0 ? (
              <div className="space-y-4 mb-4">
                {(['rad', 'materijal', 'ostalo'] as const).map(cat => {
                  const catItems = groupedPriceItems[cat] || []
                  if (!catItems.length) return null
                  return (
                    <div key={cat}>
                      <div className="text-xs font-bold text-gray-400 uppercase mb-2">{CATEGORY_LABELS[cat]}</div>
                      <div className="space-y-2">
                        {catItems.map((pi: any) => {
                          const qty = getQty(pi)
                          return (
                            <div key={pi.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{pi.name}</div>
                                <div className="text-xs text-gray-400">{pi.price.toLocaleString('sr-RS')} RSD / {pi.unit}</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => setQty(pi, -1)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${qty > 0 ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-400'}`}>−</button>
                                <span className="w-6 text-center font-semibold text-gray-900">{qty}</span>
                                <button onClick={() => setQty(pi, 1)} className="w-8 h-8 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center text-lg font-bold">+</button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-blue-50 text-blue-700 rounded-xl p-4 text-sm mb-4">
                Nema stavki u cenovniku. Dodaj ručno ispod ili prvo{' '}
                <Link href="/price-items" className="underline font-medium">popuni cenovnik</Link>.
              </div>
            )}

            {!showManual ? (
              <button onClick={() => setShowManual(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#1e3a8a] hover:text-[#1e3a8a] font-medium transition-colors">
                + Dodaj ručno
              </button>
            ) : (
              <div className="bg-white border-2 border-[#1e3a8a] rounded-xl p-4 space-y-3">
                <input value={manualItem.name} onChange={e => setManualItem(m => ({ ...m, name: e.target.value }))}
                  placeholder="Naziv stavke" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                <div className="flex gap-2">
                  <input value={manualItem.price} onChange={e => setManualItem(m => ({ ...m, price: e.target.value }))}
                    placeholder="Cena (RSD)" type="number" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                  <input value={manualItem.unit} onChange={e => setManualItem(m => ({ ...m, unit: e.target.value }))}
                    placeholder="jed." className="w-20 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
                </div>
                <select value={manualItem.category} onChange={e => setManualItem(m => ({ ...m, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]">
                  <option value="rad">🔧 Rad</option>
                  <option value="materijal">📦 Materijal</option>
                  <option value="ostalo">➕ Ostalo</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={addManual} className="flex-1 bg-[#1e3a8a] text-white py-2.5 rounded-xl font-semibold">Dodaj</button>
                  <button onClick={() => setShowManual(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold">Otkaži</button>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Izabrane stavke</div>
                {items.map(item => (
                  <div key={item.name} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-400 ml-1">×{item.quantity}</span>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">{(item.price * item.quantity).toLocaleString('sr-RS')} RSD</span>
                    <button onClick={() => removeItem(item.name)} className="text-gray-300 hover:text-red-400 text-lg ml-1">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pregled ponude</h2>

            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <div className="text-sm text-gray-500 mb-1">Klijent</div>
              <div className="font-semibold text-gray-900">{clientDisplayName(selectedClient)}</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
              <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Stavke</div>
              {items.map(item => (
                <div key={item.name} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} × {item.price.toLocaleString('sr-RS')} RSD</div>
                  </div>
                  <div className="text-gray-900 font-semibold text-sm">{(item.price * item.quantity).toLocaleString('sr-RS')} RSD</div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="font-bold text-green-800 mb-3">💰 Vaša zarada na projektu</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">🔧 Rad (vaša zarada)</span>
                  <span className="font-semibold text-green-700">{laborTotal.toLocaleString('sr-RS')} RSD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">📦 Materijal</span>
                  <span className="font-semibold text-gray-700">{materialTotal.toLocaleString('sr-RS')} RSD</span>
                </div>
                <div className="border-t border-green-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-800">Ukupno ponuda</span>
                  <span className="font-bold text-gray-900">{subtotal.toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popust (%)</label>
                <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Napomena</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Uslovi plaćanja, rok isporuke..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] resize-none" />
              </div>
              {discount > 0 && (
                <div className="text-right">
                  <span className="text-sm text-gray-500">Ukupno sa popustom: </span>
                  <span className="font-bold text-[#1e3a8a]">{total.toLocaleString('sr-RS')} RSD</span>
                </div>
              )}
            </div>

            <BillingSection
              priceDisplayMode={priceDisplayMode} setPriceDisplayMode={setPriceDisplayMode}
              paymentTerms={paymentTerms} setPaymentTerms={setPaymentTerms}
              paymentTermsNote={paymentTermsNote} setPaymentTermsNote={setPaymentTermsNote}
              billingNotesSnapshot={billingNotesSnapshot}
            />
          </div>
        )}
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-20 md:pl-56">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="flex-none px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold">
            ← Nazad
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={step === 1 ? !selectedClient : items.length === 0}
            className="flex-1 py-3.5 bg-[#1e3a8a] text-white rounded-xl font-semibold disabled:opacity-40">
            Dalje →
          </button>
        ) : (
          <button onClick={submit} disabled={saving}
            className="flex-1 py-3.5 bg-[#1e3a8a] text-white rounded-xl font-semibold disabled:opacity-50">
            {saving ? 'Kreiranje...' : '✓ Kreiraj ponudu'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function NewQuotePage() {
  return (
    <Suspense>
      <NewQuoteContent />
    </Suspense>
  )
}
