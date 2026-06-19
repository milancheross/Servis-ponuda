import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const DELETE = withAuth(async (_req, userId, ctx) => {
  const { actId } = ctx.params
  const { error } = await supabase
    .from('client_activities')
    .delete()
    .eq('id', actId)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
