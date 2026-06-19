import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, ctx: { params: { token: string } }) {
  const { token } = ctx.params
  const { action, signed_by, signature_data } = await req.json()

  if (!['prihvacena', 'odbijena'].includes(action)) {
    return NextResponse.json({ error: 'Nevažeća akcija' }, { status: 400 })
  }

  const { data: quote, error: fetchErr } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('tracking_token', token)
    .single()

  if (fetchErr || !quote) {
    return NextResponse.json({ error: 'Ponuda nije pronađena' }, { status: 404 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null

  const updates: any = { status: action }
  if (action === 'prihvacena') {
    updates.signed_by = signed_by || null
    updates.signed_at = new Date().toISOString()
    updates.signed_ip = ip
    updates.signature_data = signature_data || null
  }

  const { error } = await supabase.from('quotes').update(updates).eq('id', quote.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
