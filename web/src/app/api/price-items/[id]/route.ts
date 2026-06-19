import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const PUT = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const { name, unit, price, category } = await req.json()
  const { data, error } = await supabase
    .from('price_items')
    .update({ name, unit, price, category })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data)
})

export const DELETE = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { error } = await supabase
    .from('price_items')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
