import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const POST = withAuth(async (_req, userId, { params }) => {
  // paid_at does not exist in schema — only update status
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'placeno' })
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok({ invoice: { ...data, total: data.total_amount } })
})
