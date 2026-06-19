import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { action, signed_by, signature_data } = await req.json()
    if (!action || !signed_by?.trim()) {
      return NextResponse.json({ error: 'Ime i potpis su obavezni' }, { status: 400 })
    }
    if (action !== 'prihvacena' && action !== 'odbijena') {
      return NextResponse.json({ error: 'Nevalidan action' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'nepoznat'

    const updateData: Record<string, any> = { status: action }
    if (action === 'prihvacena') {
      updateData.signed_by = signed_by.trim()
      updateData.signed_at = new Date().toISOString()
      updateData.signed_ip = ip
      if (signature_data) updateData.signature_data = signature_data
    }

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('tracking_token', params.token)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quote: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
