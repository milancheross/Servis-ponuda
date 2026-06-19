import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const POST = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (qErr) return err(qErr.message, 404)

  const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const year = new Date().getFullYear()
  const num = String((count || 0) + 1).padStart(3, '0')
  const invoice_number = `FA-${year}-${num}`
  const issued_at = new Date().toISOString().split('T')[0]

  const { data: invoice, error: iErr } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: quote.client_id,
      quote_id: quote.id,
      invoice_number,
      status: 'neplaceno',
      total_amount: quote.total_amount,
      issued_at,
    })
    .select()
    .single()
  if (iErr) return err(iErr.message, 500)

  await supabase.from('quotes').update({ status: 'prihvacena' }).eq('id', id).eq('user_id', userId)

  return ok(invoice, 201)
})
