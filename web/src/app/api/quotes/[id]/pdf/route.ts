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

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, client:clients(id,name,phone,email,address), items:quote_items(*)')
    .eq('id', params.id)
    .eq('user_id', payload.userId)
    .single()
  if (error || !quote) return NextResponse.json({ error: 'Nije pronadjeno' }, { status: 404 })

  const { data: user } = await supabase.from('users').select('company_name,address,phone').eq('id', payload.userId).single()

  const pdfBuffer = await renderToBuffer(
    React.createElement(QuotePdf, {
      data: {
        type: 'ponuda',
        date: new Date(quote.created_at).toLocaleDateString('sr-RS'),
        companyName: user?.company_name || 'Firma',
        companyAddress: user?.address,
        companyPhone: user?.phone,
        client: quote.client || { name: 'Nepoznat' },
        items: (quote.items || []).map((i: any) => ({
          name: i.name, unit: i.unit,
          quantity: Number(i.quantity), price: Number(i.price), total: Number(i.total),
        })),
        total: Number(quote.total_amount),
        discountPercent: quote.discount_percent ? Number(quote.discount_percent) : undefined,
        note: quote.note,
      },
    })
  )

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ponuda-${params.id.slice(0, 8)}.pdf"`,
    },
  })
}
