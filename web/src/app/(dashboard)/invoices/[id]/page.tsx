'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

function fmt(n: number) { return (n || 0).toLocaleString('sr-RS') + ' RSD' }

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(d => { setInvoice(d); setLoading(false) })
  }, [id])

  async function markPaid() {
    setPaying(true)
    const res = await fetch(`/api/invoices/${id}/pay`, { method: 'POST' })
    if (res.ok) setInvoice((prev: any) => ({ ...prev, status: 'placeno' }))
    setPaying(false)
  }

  if (loading) return <div className="p-4 md:p-8"><div className="h-64 bg-gray-200 rounded-xl animate-pulse" /></div>
  if (!invoice || invoice.error) return <div className="p-4">Faktura nije pronađena</div>

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/invoices" className="text-gray-500 hover:text-gray-700">← Nazad</Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{invoice.invoice_number}</h1>
        <StatusBadge status={invoice.status} />
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Klijent</span><span className="font-medium">{invoice.client?.name || '—'}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Datum izdavanja</span><span>{invoice.issued_at}</span></div>
        {invoice.due_date && <div className="flex justify-between text-sm"><span className="text-gray-500">Rok plaćanja</span><span>{invoice.due_date}</span></div>}
        <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-100"><span>Ukupno</span><span className="text-[#1e3a8a]">{fmt(invoice.total_amount)}</span></div>
      </div>
      {invoice.items?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase">Stavke</div>
          {invoice.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
              <div className="flex-1 text-sm"><div className="font-medium text-gray-900">{item.name}</div><div className="text-xs text-gray-400">{item.quantity} × {(item.price || 0).toLocaleString('sr-RS')} RSD</div></div>
              <div className="text-gray-900 font-semibold text-sm">{fmt(item.total)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <a href={`/api/invoices/${id}/pdf`} target="_blank" className="block w-full text-center border border-[#1e3a8a] text-[#1e3a8a] py-3 rounded-xl font-semibold">📄 Preuzmi PDF</a>
        {invoice.status === 'neplaceno' && (
          <button onClick={markPaid} disabled={paying} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {paying ? 'Ažuriranje...' : '✅ Označi kao plaćeno'}
          </button>
        )}
      </div>
    </div>
  )
}
