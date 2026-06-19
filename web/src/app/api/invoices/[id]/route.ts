import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAuth(async (_req, userId, { params }) => {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id,name,phone,email,address)')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  if (error) return err('Nije pronadjeno', 404)

  // items are stored in quote_items linked via quote_id
  let items: any[] = []
  if (invoice.quote_id) {
    const { data } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', invoice.quote_id)
    items = data || []
  }

  return ok({ invoice: { ...invoice, total: invoice.total_amount, items } })
})

export const DELETE = withAuth(async (_req, userId, { params }) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
