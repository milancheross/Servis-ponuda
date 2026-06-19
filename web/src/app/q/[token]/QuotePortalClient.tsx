'use client'

import { useState } from 'react'

export default function QuotePortalClient({ quote, token }: { quote: any; token: string }) {
  const [status, setStatus] = useState(quote.status)
  const [acting, setActing] = useState(false)

  async function respond(action: 'prihvacena' | 'odbijena') {
    setActing(true)
    await fetch(`/api/q/${token}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    setStatus(action)
    setActing(false)
  }

  const company = quote.company || {}
  const client = quote.client || {}

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1e3a8a] text-white rounded-2xl p-6 mb-6">
          <div className="text-blue-300 text-xs font-bold tracking-widest mb-1">PONUDA OD</div>
          <div className="text-xl font-bold">{company.company_name || 'Servis Ponuda'}</div>
          {company.phone && <div className="text-blue-200 text-sm mt-1">📞 {company.phone}</div>}
          <div className="mt-4 text-3xl font-bold">{(quote.total||0).toLocaleString('sr-RS')} RSD</div>
          <div className="text-blue-200 text-sm mt-1">Kreirano: {new Date(quote.created_at).toLocaleDateString('sr-RS')}</div>
        </div>
        {client.name && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Za</div>
            <div className="font-semibold">{client.name}</div>
            {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stavke</div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100"><th className="text-left py-2 text-gray-500">Naziv</th><th className="text-center py-2 text-gray-500">Kol.</th><th className="text-right py-2 text-gray-500">Ukupno</th></tr></thead>
            <tbody>{quote.items.map((item: any, idx: number) => (<tr key={idx} className="border-b border-gray-50"><td className="py-3 font-medium">{item.name}</td><td className="py-3 text-center text-gray-500">{item.quantity} {item.unit}</td><td className="py-3 text-right font-semibold">{item.total.toLocaleString('sr-RS')} RSD</td></tr>))}</tbody>
          </table>
          <div className="mt-4 flex justify-between font-bold text-base border-t pt-3"><span>UKUPNO:</span><span className="text-[#2563EB]">{(quote.total||0).toLocaleString('sr-RS')} RSD</span></div>
        </div>
        {status === 'poslata' && (
          <div className="flex gap-3">
            <button onClick={() => respond('prihvacena')} disabled={acting} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60">✓ Prihvatam ponudu</button>
            <button onClick={() => respond('odbijena')} disabled={acting} className="flex-1 bg-white border-2 border-red-300 text-red-600 py-4 rounded-xl font-bold hover:bg-red-50 disabled:opacity-60">✕ Odbijam</button>
          </div>
        )}
        {status === 'prihvacena' && <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center"><div className="text-3xl mb-2">✅</div><div className="font-bold text-green-800 text-lg">Prihvatili ste ponudu</div></div>}
        {status === 'odbijena' && <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center"><div className="text-3xl mb-2">❌</div><div className="font-bold text-red-800 text-lg">Odbili ste ponudu</div></div>}
      </div>
    </div>
  )
}
