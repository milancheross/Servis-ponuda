'use client'

import { useRef, useState } from 'react'

function fmt(n: number) { return (n || 0).toLocaleString('sr-RS') + ' RSD' }

interface Props {
  token: string
  quote: any
  items: any[]
  company: any
}

export default function QuotePortalClient({ token, quote, items, company }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const [signedBy, setSignedBy] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [action, setAction] = useState<'prihvacena' | 'odbijena' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    setDrawing(true)
    canvas.setPointerCapture(e.pointerId)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    setHasSig(true)
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return
    e.preventDefault()
    setDrawing(false)
  }

  function clearSig() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  async function respond(act: 'prihvacena' | 'odbijena') {
    setSubmitting(true)
    setAction(act)
    let signature_data: string | null = null
    if (act === 'prihvacena' && canvasRef.current) {
      signature_data = canvasRef.current.toDataURL('image/png')
    }
    await fetch(`/api/q/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, signed_by: signedBy, signature_data }),
    })
    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          {action === 'prihvacena' ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-green-700 mb-2">Ponuda prihvaćena!</h2>
              <p className="text-gray-500 text-sm">Hvala! Servisera ćete kontaktirati uskoro.</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-red-700 mb-2">Ponuda odbijena</h2>
              <p className="text-gray-500 text-sm">Hvala na odgovoru.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (quote.status !== 'poslata' && !quote.signed_by) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-bold text-gray-800">Ponuda je {quote.status === 'prihvacena' ? 'već prihvaćena' : quote.status === 'odbijena' ? 'odbijena' : 'nedostupna'}</h2>
        </div>
      </div>
    )
  }

  const total = quote.total_amount || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[#1e3a8a]">{company?.company_name}</div>
          {company?.phone && <div className="text-gray-500 text-sm mt-1">{company.phone}</div>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="bg-[#1e3a8a] text-white px-6 py-4">
            <div className="text-sm text-blue-200">PONUDA</div>
            <div className="text-xl font-bold">{quote.quote_number}</div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold mb-2">Za:</div>
            <div className="font-semibold text-gray-900">{quote.client?.name}</div>
            {quote.client?.address && <div className="text-sm text-gray-500">{quote.client.address}</div>}
          </div>

          <div className="px-6 py-4">
            <div className="text-xs text-gray-400 uppercase font-bold mb-3">Stavke</div>
            <div className="space-y-3">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                    <div className="text-xs text-gray-400">{item.quantity} × {(item.price || 0).toLocaleString('sr-RS')} RSD</div>
                  </div>
                  <div className="text-gray-900 font-semibold text-sm ml-4">{fmt(item.total)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">UKUPNO</span>
              <span className="font-bold text-[#1e3a8a] text-lg">{fmt(total)}</span>
            </div>
          </div>

          {quote.note && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Napomena</div>
              <div className="text-sm text-gray-700">{quote.note}</div>
            </div>
          )}
        </div>

        {quote.signed_by && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold text-green-800">Ponuda je prihvaćena</div>
            <div className="text-sm text-green-600 mt-1">Potpisao: {quote.signed_by}</div>
          </div>
        )}

        {quote.status === 'poslata' && !quote.signed_by && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Vaš odgovor</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vaše ime i prezime</label>
              <input value={signedBy} onChange={e => setSignedBy(e.target.value)}
                placeholder="npr. Marko Marković"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Potpis (ako prihvatate)</label>
              <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  className="w-full touch-none"
                  style={{ height: '120px' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                />
                {!hasSig && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
                    Potpišite prstom ili mišem
                  </div>
                )}
              </div>
              {hasSig && (
                <button onClick={clearSig} className="text-xs text-gray-400 mt-1 underline">Obriši potpis</button>
              )}
            </div>

            <div className="text-xs text-gray-400 mb-4 text-center">
              Datum: {new Date().toLocaleDateString('sr-RS')}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => respond('odbijena')}
                disabled={submitting}
                className="flex-1 border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-semibold text-base disabled:opacity-50"
              >
                ✗ Odbij
              </button>
              <button
                onClick={() => respond('prihvacena')}
                disabled={submitting || !signedBy.trim()}
                className="flex-2 flex-[2] bg-[#1e3a8a] text-white py-3.5 rounded-xl font-semibold text-base disabled:opacity-40"
              >
                {submitting ? 'Slanje...' : '✓ Prihvati ponudu'}
              </button>
            </div>
            {!signedBy.trim() && <p className="text-xs text-gray-400 text-center mt-2">Unesite ime da biste prihvatili</p>}
          </div>
        )}
      </div>
    </div>
  )
}
