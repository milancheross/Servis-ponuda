import { renderToBuffer } from '@react-pdf/renderer'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { QuotePdf } from '@/lib/pdf-template'
import React from 'react'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = req.cookies.get('sp_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id,name,phone,email,address)')
    .eq('id', params.id)
    .eq('user_id', payload.userId)
    .single()
  if (error || !invoice) return NextResponse.json({ error: 'Nije pronadjeno' }, { status: 404 })

  let items: any[] = []
  if (invoice.quote_id) {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', invoice.quote_id)
    items = data || []
  }

  const { data: user } = await supabase.from('users').select('company_name,address,phone').eq('id', payload.userId).single()

  const pdfBuffer = await renderToBuffer(
    React.createElement(QuotePdf, {
      data: {
        type: 'faktura',
        number: invoice.invoice_number,
        date: new Date(invoice.issued_at).toLocaleDateString('sr-RS'),
        companyName: user?.company_name || 'Firma',
        companyAddress: user?.address,
        companyPhone: user?.phone,
        client: invoice.client || { name: 'Nepoznat' },
        items: items.map((i: any) => ({
          name: i.name, unit: i.unit,
          quantity: Number(i.quantity), price: Number(i.price), total: Number(i.total),
        })),
        total: Number(invoice.total_amount),
        note: undefined,
      },
    })
  )

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="faktura-${invoice.invoice_number}.pdf"`,
    },
  })
}
