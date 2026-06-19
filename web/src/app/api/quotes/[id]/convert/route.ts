import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const POST = withAuth(async (_req, userId, { params }) => {
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*, items:quote_items(*)')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  if (qErr) return err('Ponuda nije pronadjena', 404)

  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const invoiceNumber = `${year}-${String((count || 0) + 1).padStart(4, '0')}`

  const issuedDate = new Date().toISOString().split('T')[0] // date type expects YYYY-MM-DD

  const { data: invoice, error: iErr } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: quote.client_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber,
      status: 'neplaceno',
      total_amount: quote.total_amount,
      issued_at: issuedDate,
    })
    .select()
    .single()
  if (iErr) return err(iErr.message, 500)

  // items stay in quote_items linked via quote_id — no invoice_id column exists

  await supabase.from('quotes').update({ status: 'prihvacena' }).eq('id', quote.id)

  return ok({ invoice: { ...invoice, total: invoice.total_amount } }, 201)
})
