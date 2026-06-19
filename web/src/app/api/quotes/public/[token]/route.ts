import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, client:clients(id,name,phone,email,address), items:quote_items(*)')
    .eq('tracking_token', params.token)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Nije pronadjeno' }, { status: 404 })
  await supabase.from('quotes').update({ opened_at: new Date().toISOString() }).eq('id', data.id).is('opened_at', null)
  return NextResponse.json({ quote: { ...data, total: data.total_amount } })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { action } = await req.json()
  const status = action === 'accept' ? 'prihvacena' : 'odbijena'
  const { data, error } = await supabase
    .from('quotes')
    .update({ status })
    .eq('tracking_token', params.token)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quote: data })
}
