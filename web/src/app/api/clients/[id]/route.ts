import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return err(error.message, 404)
  return ok(data)
})

export const PUT = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const body = await req.json()
  const {
    client_type = 'person',
    name, phone, email, address, notes,
    company_name, contact_person, tax_id, registration_number,
    billing_address, job_site_address,
    legal_form = 'unknown', vat_status = 'unknown', entrepreneur_tax_mode = 'unknown',
    billing_notes, payment_terms = 'unknown', payment_terms_note,
    invoice_preference = 'unknown', preferred_price_display_mode = 'unknown',
  } = body

  if (!name) return err('Ime / naziv firme je obavezno')

  const payload: Record<string, unknown> = {
    client_type,
    name,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    billing_notes: billing_notes || null,
    payment_terms,
    payment_terms_note: payment_terms_note || null,
    invoice_preference,
    preferred_price_display_mode,
  }

  if (client_type === 'person') {
    payload.address = address || null
    payload.company_name = null
    payload.contact_person = null
    payload.tax_id = null
    payload.registration_number = null
    payload.billing_address = null
    payload.job_site_address = null
    payload.legal_form = 'unknown'
    payload.vat_status = 'unknown'
    payload.entrepreneur_tax_mode = 'unknown'
  } else {
    payload.company_name = company_name || name
    payload.contact_person = contact_person || null
    payload.tax_id = tax_id || null
    payload.registration_number = registration_number || null
    payload.billing_address = billing_address || null
    payload.job_site_address = job_site_address || null
    payload.legal_form = legal_form
    payload.vat_status = vat_status
    payload.entrepreneur_tax_mode = entrepreneur_tax_mode
  }

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data)
})

export const DELETE = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
