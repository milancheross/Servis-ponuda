'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'

const CAT_LABELS: Record<string, string> = { rad: 'Rad', materijal: 'Materijal', ostalo: 'Ostalo' }
const CAT_COLORS: Record<string, string> = {
  rad: 'bg-blue-50 border-blue-200 text-blue-800',
  materijal: 'bg-orange-50 border-orange-200 text-orange-800',
  ostalo: 'bg-gray-50 border-gray-200 text-gray-700',
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ note: '', valid_until: '', discount_percent: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/quotes/${id}`, { credentials: 'include' })
      .then(r => r.json()).then(d => {
        setQuote(d.quote)
        setEditForm({ note: d.quote?.note || '', valid_until: d.quote?.valid_until ? d.quote.valid_until.split('T')[0] : '', discount_percent: d.quote?.discount_percent || 0 })
        if (d.quote?.tracking_token && d.quote?.status !== 'nacrt') setTrackingUrl(`${window.location.origin}/q/${d.quote.tracking_token}`)
        setLoading(false)
      })
  }, [id])

  async function handleSend() {
    setActing(true)
    const r = await fetch(`/api/quotes/${id}/send`, { method: 'POST', credentials: 'include' })
    const d = await r.json()
    setQuote(d.quote)
    if (d.tracking_url) setTrackingUrl(d.tracking_url)
    setActing(false)
  }

  async function handleConvert() {
    setActing(true)
    const r = await fetch(`/api/quotes/${id}/convert`, { method: 'POST', credentials: 'include' })
    const d = await r.json()
    setActing(false)
    if (r.ok) router.push(`/invoices/${d.invoice.id}`)
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const r = await fetch(`/api/quotes/${id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
    const d = await r.json()
    if (r.ok) { setQuote(d.quote); setEditMode(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Obrisati ponudu?')) return
    await fetch(`/api/quotes/${id}`, { method: 'DELETE', credentials: 'include' })
    router.push('/quotes')
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Učitavanje...</div>
  if (!quote) return <div className="p-6 text-gray-400 text-sm">Ponuda nije pronađena</div>

  const canEdit = quote.status === 'nacrt'
  const items: any[] = quote.items || []

  // Troskovnik breakdown by category
  const breakdown: Record<string, number> = {}
  for (const item of items) {
    const cat = item.category || 'ostalo'
    breakdown[cat] = (breakdown[cat] || 0) + Number(item.total)
  }
  const hasCategoryData = items.some(i => i.category && i.category !== 'ostalo') || Object.keys(breakdown).length > 1

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-4 hover:underline print:hidden">← Nazad</button>

      <div className="bg-[#1e3a8a] text-white rounded-2xl p-5 md:p-6 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-blue-300 text-xs font-bold tracking-widest mb-1">PONUDA</div>
            {quote.quote_number && <div className="text-blue-200 text-sm font-mono mb-1">{quote.quote_number}</div>}
            {user && <div className="font-bold text-base md:text-lg">{user.company_name}</div>}
          </div>
          <StatusBadge status={quote.status} />
        </div>
        <div className="text-2xl md:text-3xl font-bold mb-2">{(quote.total || 0).toLocaleString('sr-RS')} RSD</div>
        <div className="text-blue-200 text-sm">
          Kreirano: {new Date(quote.created_at).toLocaleDateString('sr-RS')}
          {quote.sent_at && ` • Poslato: ${new Date(quote.sent_at).toLocaleDateString('sr-RS')}`}
        </div>
      </div>

      {canEdit && editMode ? (
        <form onSubmit={handleSaveEdit} className="bg-white rounded-xl border border-blue-200 p-5 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Izmeni ponudu</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Napomena</label>
              <textarea value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Važi do</label>
                <input type="date" value={editForm.valid_until} onChange={e => setEditForm(f => ({ ...f, valid_until: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Popust (%)</label>
                <input type="number" min="0" max="100" value={editForm.discount_percent} onChange={e => setEditForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="flex-1 bg-[#2563EB] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">{saving ? 'Čuvanje...' : 'Sačuvaj izmene'}</button>
            <button type="button" onClick={() => setEditMode(false)} className="px-5 py-2.5 rounded-lg text-sm border border-gray-300 text-gray-600">Otkaži</button>
          </div>
        </form>
      ) : (
        <>
          {quote.client && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Klijent</div>
              <div className="font-semibold">{quote.client.name}</div>
              {quote.client.phone && <div className="text-sm text-gray-500 mt-1">📞 {quote.client.phone}</div>}
              {quote.client.email && <div className="text-sm text-gray-500">✉ {quote.client.email}</div>}
            </div>
          )}

          {/* Stavke */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stavke</div>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} {item.unit} × {Number(item.price).toLocaleString('sr-RS')} RSD</div>
                  </div>
                  <div className="font-semibold shrink-0 ml-3">{Number(item.total).toLocaleString('sr-RS')} RSD</div>
                </div>
              ))}
            </div>
            {quote.discount_percent > 0 && (
              <div className="flex justify-between text-sm text-red-600 mt-2 pt-2 border-t">
                <span>Popust ({quote.discount_percent}%)</span>
                <span>-{(quote.total_amount / (1 - quote.discount_percent / 100) * quote.discount_percent / 100).toLocaleString('sr-RS')} RSD</span>
              </div>
            )}
            <div className="mt-3 flex justify-between font-bold border-t pt-3">
              <span>UKUPNO</span><span className="text-[#2563EB]">{(quote.total || 0).toLocaleString('sr-RS')} RSD</span>
            </div>
          </div>

          {/* Troskovnik */}
          {Object.keys(breakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">📊 Troškovnik</div>
              <div className="space-y-2">
                {Object.entries(breakdown).map(([cat, amount]) => (
                  <div key={cat} className={`flex justify-between items-center px-3 py-2 rounded-lg border text-sm ${CAT_COLORS[cat] || CAT_COLORS.ostalo}`}>
                    <span className="font-medium">{CAT_LABELS[cat] || cat}</span>
                    <span className="font-bold">{Number(amount).toLocaleString('sr-RS')} RSD</span>
                  </div>
                ))}
                <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#1e3a8a] text-white text-sm">
                  <span className="font-bold">Ukupno ponuda</span>
                  <span className="font-bold">{(quote.total || 0).toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>
            </div>
          )}

          {(quote.note || quote.valid_until) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm text-sm">
              {quote.note && <div className="text-gray-700 mb-1"><span className="font-medium">Napomena:</span> {quote.note}</div>}
              {quote.valid_until && <div className="text-gray-500">Važi do: {new Date(quote.valid_until).toLocaleDateString('sr-RS')}</div>}
            </div>
          )}

          {quote.signed_by && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
              <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">✍️ Digitalni potpis</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Potpisao:</span> <span className="font-semibold">{quote.signed_by}</span></div>
                <div><span className="text-gray-500">Datum:</span> <span className="font-semibold">{new Date(quote.signed_at).toLocaleString('sr-RS')}</span></div>
                <div><span className="text-gray-500">IP:</span> <span className="font-mono text-xs">{quote.signed_ip}</span></div>
              </div>
              {quote.signature_data && <img src={quote.signature_data} alt="potpis" className="mt-2 h-16 border border-green-200 rounded-lg bg-white p-1" />}
            </div>
          )}

          {trackingUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3 text-sm">
              <div className="font-semibold text-blue-800 mb-2">Link za klijenta:</div>
              <div className="flex items-center gap-2">
                <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-blue-600 break-all hover:underline flex-1 text-xs">{trackingUrl}</a>
                <button onClick={() => navigator.clipboard.writeText(trackingUrl)} className="shrink-0 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-200">Kopiraj</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2 print:hidden">
        {canEdit && !editMode && (
          <button onClick={() => setEditMode(true)} className="flex-1 sm:flex-none border border-blue-500 text-blue-600 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-50">✏️ Izmeni</button>
        )}
        {quote.status === 'nacrt' && (
          <button onClick={handleSend} disabled={acting} className="flex-1 sm:flex-none bg-[#2563EB] text-white px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60">
            {acting ? '...' : '📤 Pošalji'}
          </button>
        )}
        {(quote.status === 'prihvacena' || quote.status === 'poslata') && (
          <button onClick={handleConvert} disabled={acting} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60">
            {acting ? '...' : '🧾 Kreiraj fakturu'}
          </button>
        )}
        <a href={`/api/quotes/${id}/pdf`} target="_blank" className="flex-1 sm:flex-none border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 text-center">📄 PDF</a>
        {canEdit && (
          <button onClick={handleDelete} className="border border-red-200 text-red-500 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-50">Obriši</button>
        )}
      </div>
    </div>
  )
}
