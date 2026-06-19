'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

function SignaturePad({ onChange }: { onChange: (data: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  function getPos(e: PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    function onDown(e: PointerEvent) {
      e.preventDefault()
      drawing.current = true
      canvas.setPointerCapture(e.pointerId)
      const { x, y } = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
    function onMove(e: PointerEvent) {
      if (!drawing.current) return
      e.preventDefault()
      const { x, y } = getPos(e, canvas)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    function onUp(e: PointerEvent) {
      if (!drawing.current) return
      drawing.current = false
      setIsEmpty(false)
      onChange(canvas.toDataURL('image/png'))
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
    }
  }, [onChange])

  function clear() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} width={600} height={180} className="w-full" style={{ display: 'block', touchAction: 'none' }} />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none select-none">
            Potpišite ovde prstom ili mišem
          </div>
        )}
      </div>
      {!isEmpty && (
        <button type="button" onClick={clear} className="mt-2 text-xs text-red-500 hover:text-red-700">
          ✕ Obriši potpis
        </button>
      )}
    </div>
  )
}

export default function QuotePortalClient({ quote, token }: { quote: any; token: string }) {
  const [status, setStatus] = useState(quote.status)
  const [acting, setActing] = useState(false)
  const [showSignForm, setShowSignForm] = useState(false)
  const [signedBy, setSignedBy] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [signError, setSignError] = useState('')
  const [signedInfo, setSignedInfo] = useState<{ by: string; at: string } | null>(
    quote.signed_by ? { by: quote.signed_by, at: quote.signed_at } : null
  )

  const handleSigChange = useCallback((data: string | null) => setSignatureData(data), [])

  async function handleDecline() {
    if (!confirm('Sigurno odbijate ponudu?')) return
    setActing(true)
    await fetch(`/api/q/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'odbijena', signed_by: 'N/A' }),
    })
    setStatus('odbijena')
    setActing(false)
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    setSignError('')
    if (!signedBy.trim()) { setSignError('Unesite ime i prezime'); return }
    if (!signatureData) { setSignError('Potpis je obavezan'); return }
    setActing(true)
    const r = await fetch(`/api/q/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'prihvacena', signed_by: signedBy, signature_data: signatureData }),
    })
    const d = await r.json()
    if (!r.ok) { setSignError(d.error || 'Greška'); setActing(false); return }
    setStatus('prihvacena')
    setSignedInfo({ by: signedBy, at: new Date().toISOString() })
    setActing(false)
  }

  const company = quote.company || {}
  const client = quote.client || {}

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-[#1e3a8a] text-white rounded-2xl p-6 mb-6">
          <div className="text-blue-300 text-xs font-bold tracking-widest mb-1">PONUDA OD</div>
          <div className="text-xl font-bold">{company.company_name || 'Servis Ponuda'}</div>
          {company.phone && <div className="text-blue-200 text-sm mt-1">📞 {company.phone}</div>}
          {quote.quote_number && <div className="text-blue-300 text-sm mt-1">Br. ponude: {quote.quote_number}</div>}
          <div className="mt-4 text-3xl font-bold">{(quote.total || 0).toLocaleString('sr-RS')} RSD</div>
          <div className="text-blue-200 text-sm mt-1">Kreirano: {new Date(quote.created_at).toLocaleDateString('sr-RS')}
            {quote.valid_until && ` · Važi do: ${new Date(quote.valid_until).toLocaleDateString('sr-RS')}`}
          </div>
        </div>

        {/* Client */}
        {client.name && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Za</div>
            <div className="font-semibold">{client.name}</div>
            {client.phone && <div className="text-sm text-gray-500">{client.phone}</div>}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">Stavke</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Naziv</th>
                <th className="text-center py-2 text-gray-500 font-medium">Kol.</th>
                <th className="text-right py-2 text-gray-500 font-medium">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{item.name}</td>
                  <td className="py-3 text-center text-gray-500">{item.quantity} {item.unit}</td>
                  <td className="py-3 text-right font-semibold">{Number(item.total).toLocaleString('sr-RS')} RSD</td>
                </tr>
              ))}
            </tbody>
          </table>
          {quote.discount_percent > 0 && (
            <div className="mt-3 flex justify-between text-sm text-red-600">
              <span>Popust ({quote.discount_percent}%):</span>
              <span>-{(quote.total / (1 - quote.discount_percent / 100) * quote.discount_percent / 100).toLocaleString('sr-RS')} RSD</span>
            </div>
          )}
          <div className="mt-4 flex justify-between font-bold text-base border-t pt-3">
            <span>UKUPNO:</span>
            <span className="text-[#2563EB]">{(quote.total || 0).toLocaleString('sr-RS')} RSD</span>
          </div>
        </div>

        {quote.note && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
            <span className="font-semibold">Napomena: </span>{quote.note}
          </div>
        )}

        {/* Actions */}
        {status === 'poslata' && !showSignForm && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowSignForm(true)}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700">
              ✓ Prihvatam ponudu
            </button>
            <button
              onClick={handleDecline}
              disabled={acting}
              className="flex-1 bg-white border-2 border-red-300 text-red-600 py-4 rounded-xl font-bold hover:bg-red-50 disabled:opacity-60">
              ✕ Odbijam
            </button>
          </div>
        )}

        {/* Signature form */}
        {status === 'poslata' && showSignForm && (
          <form onSubmit={handleAccept} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Potpišite ponudu</h2>
            <p className="text-sm text-gray-500 mb-5">Vaš potpis ima istu pravnu težinu kao i fizički potpis.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ime i prezime *</label>
              <input
                type="text"
                value={signedBy}
                onChange={e => setSignedBy(e.target.value)}
                placeholder="npr. Marko Marković"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Potpis *</label>
              <SignaturePad onChange={handleSigChange} />
            </div>

            <div className="text-xs text-gray-400 mb-4">
              Datum: {new Date().toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>

            {signError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{signError}</div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowSignForm(false)}
                className="px-5 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Nazad
              </button>
              <button type="submit" disabled={acting}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-60">
                {acting ? 'Čuvanje...' : '✓ Potvrdi i prihvati ponudu'}
              </button>
            </div>
          </form>
        )}

        {status === 'prihvacena' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-green-800 text-xl mb-2">Prihvatili ste ponudu</div>
            <div className="text-green-700 text-sm">
              Izvođač radova će Vas kontaktirati radi dogovora.
            </div>
            {signedInfo && (
              <div className="mt-4 bg-white rounded-xl p-4 text-left text-xs text-gray-500 space-y-1">
                <div>✍️ Potpisao: <span className="font-medium text-gray-700">{signedInfo.by}</span></div>
                <div>📅 Datum: <span className="font-medium text-gray-700">{new Date(signedInfo.at).toLocaleString('sr-RS')}</span></div>
              </div>
            )}
          </div>
        )}

        {status === 'odbijena' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <div className="font-bold text-red-800 text-xl">Odbili ste ponudu</div>
          </div>
        )}

      </div>
    </div>
  )
}
