'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    fetch(`/api/invoices/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setInvoice(d.invoice); setLoading(false) })
  }, [id])

  async function handleMarkPaid() {
    if (!confirm('Označiti fakturu kao plaćenu?')) return
    setActing(true)
    const r = await fetch(`/api/invoices/${id}/pay`, { method: 'POST', credentials: 'include' })
    const d = await r.json()
    setInvoice(d.invoice)
    setActing(false)
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Učitavanje...</div>
  if (!invoice) return <div className="p-6 text-gray-400 text-sm">Faktura nije pronađena</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 text-sm mb-6 hover:underline print:hidden">← Nazad</button>
      <div className="bg-[#1e3a8a] text-white rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-blue-300 text-xs font-bold tracking-widest mb-1">FAKTURA</div>
            <div className="font-bold text-xl">#{invoice.invoice_number}</div>
          </div>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="text-3xl font-bold mb-2">{(invoice.total||0).toLocaleString('sr-RS')} RSD</div>
        <div className="text-blue-200 text-sm">
          Izdato: {new Date(invoice.issued_at).toLocaleDateString('sr-RS')}
          {invoice.due_date && ` • Rok: ${new Date(invoice.due_date).toLocaleDateString('sr-RS')}`}
        </div>
        {invoice.status === 'placeno' && (
          <div className="text-green-300 text-sm mt-1">✓ Plaćeno</div>
        )}
      </div>

      {invoice.client && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Klijent</div>
          <div className="font-semibold">{invoice.client.name}</div>
          {invoice.client.phone && <div className="text-sm text-gray-500 mt-1">📞 {invoice.client.phone}</div>}
          {invoice.client.email && <div className="text-sm text-gray-500">✉ {invoice.client.email}</div>}
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
            {(invoice.items||[]).map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-3 font-medium">{item.name}</td>
                <td className="py-3 text-center text-gray-500">{item.quantity} {item.unit}</td>
                <td className="py-3 text-right font-semibold">{Number(item.total).toLocaleString('sr-RS')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-between font-bold text-base border-t pt-2">
          <span>UKUPNO:</span><span className="text-[#2563EB]">{(invoice.total||0).toLocaleString('sr-RS')} RSD</span>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        {invoice.status !== 'placeno' && (
          <button onClick={handleMarkPaid} disabled={acting} className="bg-green-600 text-white px-5 py-3 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-60">
            {acting ? '...' : '✓ Označi kao plaćeno'}
          </button>
        )}
        <a href={`/api/invoices/${id}/pdf`} target="_blank"
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
