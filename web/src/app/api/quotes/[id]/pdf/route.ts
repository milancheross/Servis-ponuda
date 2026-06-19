import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-helpers'
import { buildQuotePdf } from '@/lib/pdf-template'
import { renderToBuffer } from '@react-pdf/renderer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest, userId: string, ctx) => {
  const { id } = ctx.params

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, client:clients(name, phone, email, address)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: user } = await supabase.from('users').select('company_name, address, phone, pib').eq('id', userId).single()
  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', id)

  const buffer = await renderToBuffer(buildQuotePdf({
    type: 'quote',
    number: quote.quote_number || quote.id,
    date: new Date(quote.created_at).toLocaleDateString('sr-RS'),
    company: { name: user?.company_name || 'Firma', address: user?.address, phone: user?.phone, pib: user?.pib },
    client: quote.client || { name: 'Klijent' },
    items: (items || []).map((i: any) => ({ name: i.name, unit: i.unit, quantity: i.quantity, price: i.price, total: i.total })),
    total: quote.total_amount,
    discountPercent: quote.discount_percent,
    note: quote.note,
  }))

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ponuda-${quote.quote_number || id}.pdf"`,
    },
  })
})
