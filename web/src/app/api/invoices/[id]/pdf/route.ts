import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-helpers'
import { buildQuotePdf } from '@/lib/pdf-template'
import { renderToBuffer } from '@react-pdf/renderer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest, userId: string, ctx) => {
  const { id } = ctx.params

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email, address)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const { data: user } = await supabase.from('users').select('company_name, address, phone, pib').eq('id', userId).single()

  let items: any[] = []
  if (invoice.quote_id) {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', invoice.quote_id)
    items = data || []
  }

  const buffer = await renderToBuffer(buildQuotePdf({
    type: 'invoice',
    number: invoice.invoice_number || invoice.id,
    date: invoice.issued_at,
    dueDate: invoice.due_date,
    company: { name: user?.company_name || 'Firma', address: user?.address, phone: user?.phone, pib: user?.pib },
    client: invoice.client || { name: 'Klijent' },
    items: items.map((i: any) => ({ name: i.name, unit: i.unit, quantity: i.quantity, price: i.price, total: i.total })),
    total: invoice.total_amount,
  }))

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="faktura-${invoice.invoice_number || id}.pdf"`,
    },
  })
})
