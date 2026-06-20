import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, client:clients(id, name, company_name, client_type, phone, email, address, billing_address, contact_person, tax_id, payment_terms, payment_terms_note, billing_notes, invoice_preference, preferred_price_display_mode)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return err(error.message, 404)

  const { data: items } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', id)
    .order('created_at')

  return ok({ ...quote, total: quote.total_amount, items: items || [] })
})

export const PUT = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const body = await req.json()
  const allowed = [
    'status', 'note', 'valid_until', 'discount_percent', 'total_amount',
    'sent_at', 'opened_at', 'signed_by', 'signed_at', 'signed_ip', 'signature_data',
    'price_display_mode', 'payment_terms', 'payment_terms_note', 'billing_notes_snapshot',
  ]
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  const { data, error } = await supabase
    .from('quotes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok({ ...data, total: data.total_amount })
})

export const DELETE = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { error } = await supabase.from('quotes').delete().eq('id', id).eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
