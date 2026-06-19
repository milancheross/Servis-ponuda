import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data, error } = await supabase
    .from('client_activities')
    .select('*')
    .eq('client_id', id)
    .eq('user_id', userId)
    .order('activity_date', { ascending: false })
  if (error) return err(error.message, 500)
  return ok(data)
})

export const POST = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const { type, note, activity_date } = await req.json()
  if (!type) return err('Tip aktivnosti je obavezan')
  const { data, error } = await supabase
    .from('client_activities')
    .insert({ user_id: userId, client_id: id, type, note, activity_date: activity_date || new Date().toISOString().split('T')[0] })
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data, 201)
})
