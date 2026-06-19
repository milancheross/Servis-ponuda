import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const DELETE = withAuth(async (_req, userId, { params }) => {
  const { error } = await supabase
    .from('client_activities')
    .delete()
    .eq('id', params.actId)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
