'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import StatusBadge from '@/components/StatusBadge'

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState('')

  useEffect(() => {
    fetch(`/api/quotes/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setQuote(d.quote)
        if (d.quote?.tracking_token && d.quote?.status !== 'nacrt') {
          setTrackingUrl(`${window.location.origin}/q/${d.quote.tracking_token}`)
        }
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

  if (loading) return <div className="p-6 text-gray-400 text-sm">Učitavanje...</div>
  if (!quote) return <div className="p-6 text-gray-400 text-sm">Ponuda nije pronađena</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-6 hover:underline print:hidden">← Nazad</button>

      <div className="bg-[#1e3a8a] text-white rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-blue-300 text-xs font-bold tracking-widest mb-1">PONUDA</div>
            {quote.quote_number && <div className="text-blue-200 text-sm font-mono mb-1">{quote.quote_number}</div>}
            {user && <div className="font-bold text-lg">{user.company_name}</div>}
          </div>
          <StatusBadge status={quote.status} />
        </div>
        <div className="text-3xl font-bold mb-2">{(quote.total || 0).toLocaleString('sr-RS')} RSD</div>
        <div className="text-blue-200 text-sm">
          Kreirano: {new Date(quote.created_at).toLocaleDateString('sr-RS')}
          {quote.sent_at && ` • Poslato: ${new Date(quote.sent_at).toLocaleDateString('sr-RS')}`}
        </div>
      </div>

      {quote.client && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Klijent</div>
          <div className="font-semibold">{quote.client.name}</div>
          {quote.client.phone && <div className="text-sm text-gray-500 mt-1">📞 {quote.client.phone}</div>}
          {quote.client.email && <div className="text-sm text-gray-500">✉ {quote.client.email}</div>}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stavke</div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left py-2 text-gray-500 font-medium">Naziv</th>
            <th className="text-center py-2 text-gray-500 font-medium">Kol.</th>
            <th className="text-right py-2 text-gray-500 font-medium">Ukupno</th>
          </tr></thead>
          <tbody>
            {(quote.items || []).map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-center text-gray-500">{item.quantity} {item.unit}</td>
                <td className="py-3 text-right font-semibold">{Number(item.total).toLocaleString('sr-RS')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between font-bold text-base border-t pt-2">
          <span>UKUPNO:</span><span className="text-[#2563EB]">{(quote.total || 0).toLocaleString('sr-RS')} RSD</span>
        </div>
      </div>

      {/* Digital signature info */}
      {quote.signed_by && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
          <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-3">✍️ Digitalni potpis</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Potpisao:</span><div className="font-semibold">{quote.signed_by}</div></div>
            <div><span className="text-gray-500">Datum:</span><div className="font-semibold">{new Date(quote.signed_at).toLocaleString('sr-RS')}</div></div>
            <div><span className="text-gray-500">IP adresa:</span><div className="font-mono text-xs">{quote.signed_ip}</div></div>
          </div>
          {quote.signature_data && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Potpis:</div>
              <img src={quote.signature_data} alt="potpis" className="h-16 border border-green-200 rounded-lg bg-white p-1" />
            </div>
          )}
        </div>
      )}

      {trackingUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm">
          <div className="font-semibold text-blue-800 mb-2">Link za klijenta:</div>
          <div className="flex items-center gap-3">
            <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-blue-600 break-all hover:underline flex-1">{trackingUrl}</a>
            <button onClick={() => navigator.clipboard.writeText(trackingUrl)}
              className="shrink-0 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-200">Kopiraj</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap print:hidden">
        {quote.status === 'nacrt' && (
          <button onClick={handleSend} disabled={acting} className="bg-[#2563EB] text-white px-5 py-3 rounded-lg font-semibold text-sm disabled:opacity-60">
            {acting ? '...' : '📤 Pošalji ponudu'}
          </button>
        )}
        {(quote.status === 'prihvacena' || quote.status === 'poslata') && (
          <button onClick={handleConvert} disabled={acting} className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold text-sm disabled:opacity-60">
            {acting ? '...' : '🧾 Kreiraj fakturu'}
          </button>
        )}
        <a href={`/api/quotes/${id}/pdf`} target="_blank"
          className="border border-gray-300 text-gray-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50 flex items-center gap-2">
          📄 Preuzmi PDF
        </a>
        <button onClick={() => window.print()} className="border border-gray-300 text-gray-600 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-gray-50">
          🖸 Štampaj
        </button>
      </div>
    </div>
  )
}
