import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const POST = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'placeno' })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok({ ...data, total: data.total_amount })
})
