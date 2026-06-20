import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, client:clients(id, name, company_name, client_type, phone, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return err(error.message, 500)
  const mapped = (data || []).map((q: any) => ({ ...q, total: q.total_amount }))
  return ok(mapped)
})

export const POST = withAuth(async (req, userId) => {
  const body = await req.json()
  const {
    client_id, items = [], note, valid_until, discount_percent = 0,
    price_display_mode = 'total_only',
    payment_terms = 'unknown',
    payment_terms_note,
    billing_notes_snapshot,
  } = body

  if (!client_id) return err('Klijent je obavezan')
  if (!items.length) return err('Dodajte bar jednu stavku')

  const total_amount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.price), 0)
  const discounted = total_amount * (1 - discount_percent / 100)

  const { count } = await supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const year = new Date().getFullYear()
  const num = String((count || 0) + 1).padStart(3, '0')
  const quote_number = `SP-${year}-${num}`
  const tracking_token = uuidv4()

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .insert({
      user_id: userId,
      client_id,
      status: 'nacrt',
      total_amount: discounted,
      tracking_token,
      quote_number,
      note,
      valid_until,
      discount_percent,
      price_display_mode,
      payment_terms,
      payment_terms_note: payment_terms_note || null,
      billing_notes_snapshot: billing_notes_snapshot || null,
    })
    .select()
    .single()

  if (qErr) return err(qErr.message, 500)

  const quoteItems = items.map((i: any) => ({
    quote_id: quote.id,
    name: i.name,
    unit: i.unit || 'kom',
    quantity: i.quantity,
    price: i.price,
    total: i.quantity * i.price,
    category: i.category || 'ostalo',
  }))

  const { error: iErr } = await supabase.from('quote_items').insert(quoteItems)
  if (iErr) return err(iErr.message, 500)

  return ok({ ...quote, total: quote.total_amount }, 201)
})
