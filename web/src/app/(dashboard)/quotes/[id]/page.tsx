'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function fmt(n: number) { return (n || 0).toLocaleString('sr-RS') + ' RSD' }

const CAT_LABELS: Record<string, string> = { rad: '🔧 Rad', materijal: '📦 Materijal', ostalo: '➕ Ostalo' }

export default function QuoteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ note: '', valid_until: '', discount_percent: 0 })
  const [trackingUrl, setTrackingUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${id}`).then(r => r.json()).then(q => {
      setQuote(q)
      setEditForm({ note: q.note || '', valid_until: q.valid_until || '', discount_percent: q.discount_percent || 0 })
      setLoading(false)
    })
  }, [id])

  async function sendQuote() {
    setSending(true)
    const res = await fetch(`/api/quotes/${id}/send`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setQuote(data)
      setTrackingUrl(data.tracking_url || '')
    }
    setSending(false)
  }

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm }),
    })
    if (res.ok) { const q = await res.json(); setQuote(q); setEditing(false) }
    setSaving(false)
  }

  async function convertToInvoice() {
    setConverting(true)
    const res = await fetch(`/api/quotes/${id}/convert`, { method: 'POST' })
    if (res.ok) {
      const inv = await res.json()
      router.push(`/invoices/${inv.id}`)
    } else setConverting(false)
  }

  if (loading) return <div className="p-4 md:p-8"><div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" /><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!quote) return <div className="p-4">Ponuda nije pronađena</div>

  const items = quote.items || []
  const catTotals = items.reduce((acc: any, item: any) => {
    const cat = item.category || 'ostalo'
    acc[cat] = (acc[cat] || 0) + item.total
    return acc
  }, {})

  return (
    <div className="p-4 md:p-8 max-w-2xl pb-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/quotes" className="text-gray-500 hover:text-gray-700">← Nazad</Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{quote.quote_number}</h1>
        <StatusBadge status={quote.status} />
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Klijent</span>
          <span className="font-medium">{quote.client?.name || '—'}</span>
        </div>
        {quote.client?.phone && <div className="flex justify-between text-sm"><span className="text-gray-500">Telefon</span><span>{quote.client.phone}</span></div>}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Kreirano</span>
          <span>{new Date(quote.created_at).toLocaleDateString('sr-RS')}</span>
        </div>
        {quote.valid_until && <div className="flex justify-between text-sm"><span className="text-gray-500">Važi do</span><span>{quote.valid_until}</span></div>}
        {quote.discount_percent > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Popust</span><span>{quote.discount_percent}%</span></div>}
        <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-100">
          <span>Ukupno</span>
          <span className="text-[#1e3a8a]">{fmt(quote.total_amount)}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Stavke</div>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
              <div className="flex-1 text-sm">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-400">{item.quantity} × {(item.price || 0).toLocaleString('sr-RS')} RSD</div>
              </div>
              <div className="text-gray-900 font-semibold text-sm">{fmt(item.total)}</div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(catTotals).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Struktura cene</div>
          {(['rad', 'materijal', 'ostalo'] as const).map(cat => catTotals[cat] ? (
            <div key={cat} className="flex justify-between items-center px-4 py-3 border-t border-gray-50 text-sm">
              <span className="text-gray-700">{CAT_LABELS[cat]}</span>
              <span className="font-semibold">{fmt(catTotals[cat])}</span>
            </div>
          ) : null)}
        </div>
      )}

      {quote.signed_by && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="font-semibold text-green-800 mb-2">✅ Digitalno potpisano</div>
          <div className="text-sm text-green-700 space-y-1">
            <div>Potpisao: <strong>{quote.signed_by}</strong></div>
            <div>Datum: {new Date(quote.signed_at).toLocaleDateString('sr-RS')}</div>
            {quote.signed_ip && <div>IP: {quote.signed_ip}</div>}
          </div>
          {quote.signature_data && (
            <img src={quote.signature_data} alt="Potpis" className="mt-3 border border-green-300 rounded-lg max-w-full h-20 object-contain bg-white" />
          )}
        </div>
      )}

      {quote.note && !editing && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-gray-700 border border-gray-100">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Napomena</div>
          {quote.note}
        </div>
      )}

      {trackingUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="text-xs text-blue-600 font-bold uppercase mb-1">Link za klijenta</div>
          <div className="text-sm text-blue-800 break-all font-mono">{trackingUrl}</div>
          <button onClick={() => navigator.clipboard.writeText(trackingUrl)} className="mt-2 text-xs text-blue-600 underline">Kopiraj link</button>
        </div>
      )}

      {quote.status === 'nacrt' && editing && (
        <div className="bg-white rounded-xl p-4 border-2 border-[#1e3a8a] mb-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Napomena</label>
            <textarea value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Važi do</label>
            <input type="date" value={editForm.valid_until} onChange={e => setEditForm(f => ({ ...f, valid_until: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Popust (%)</label>
            <input type="number" min="0" max="100" value={editForm.discount_percent} onChange={e => setEditForm(f => ({ ...f, discount_percent: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
          </div>
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving} className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">Otkaži</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <a href={`/api/quotes/${id}/pdf`} target="_blank" className="block w-full text-center border border-[#1e3a8a] text-[#1e3a8a] py-3 rounded-xl font-semibold">
          📄 Preuzmi PDF
        </a>

        {quote.status === 'nacrt' && !editing && (
          <>
            <button onClick={() => setEditing(true)} className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">
              ✏️ Izmeni ponudu
            </button>
            <button onClick={sendQuote} disabled={sending} className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
              {sending ? 'Slanje...' : '📤 Pošalji ponudu klijentu'}
            </button>
          </>
        )}

        {(quote.status === 'poslata' || quote.status === 'prihvacena') && (
          <button onClick={convertToInvoice} disabled={converting} className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {converting ? 'Kreiranje...' : '🧾 Kreiraj fakturu'}
          </button>
        )}

        {quote.status === 'poslata' && !trackingUrl && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 text-center">
            <button onClick={() => {
              const origin = window.location.origin
              setTrackingUrl(`${origin}/q/${quote.tracking_token}`)
            }} className="text-[#1e3a8a] underline">Prikaži link za klijenta</button>
          </div>
        )}
      </div>
    </div>
  )
}
