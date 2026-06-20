import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return err(error.message, 500)
  return ok(data)
})

export const POST = withAuth(async (req, userId) => {
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
    user_id: userId,
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
    .insert(payload)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data, 201)
})
