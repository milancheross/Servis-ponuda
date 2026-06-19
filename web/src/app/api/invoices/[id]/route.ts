import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name, phone, email, address)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return err(error.message, 404)

  let items: any[] = []
  if (invoice.quote_id) {
    const { data } = await supabase.from('quote_items').select('*').eq('quote_id', invoice.quote_id).order('created_at')
    items = data || []
  }

  return ok({ ...invoice, total: invoice.total_amount, items })
})

export const PUT = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const { due_date, status } = await req.json()
  const updates: any = {}
  if (due_date !== undefined) updates.due_date = due_date
  if (status !== undefined) updates.status = status
  const { data, error } = await supabase
    .from('invoices')
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
  const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
