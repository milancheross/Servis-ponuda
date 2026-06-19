import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, ctx: { params: { token: string } }) {
  const { token } = ctx.params

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, client:clients(name, address, phone, email)')
    .eq('tracking_token', token)
    .single()

  if (error || !quote) {
    return NextResponse.json({ error: 'Ponuda nije pronađena' }, { status: 404 })
  }

  if (!quote.opened_at) {
    await supabase.from('quotes').update({ opened_at: new Date().toISOString() }).eq('id', quote.id)
  }

  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('created_at')
  const { data: company } = await supabase.from('users').select('company_name, address, phone, pib').eq('id', quote.user_id).single()

  return NextResponse.json({ quote: { ...quote, total: quote.total_amount }, items: items || [], company })
}
