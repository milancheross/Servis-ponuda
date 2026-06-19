import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('price_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('category')
    .order('name')
  if (error) return err(error.message, 500)
  return ok(data)
})

export const POST = withAuth(async (req, userId) => {
  const { name, unit, price, category } = await req.json()
  if (!name || !unit || price == null) return err('Naziv, jedinica i cena su obavezni')
  const { data, error } = await supabase
    .from('price_items')
    .insert({ user_id: userId, name, unit, price, category: category || 'ostalo', is_active: true })
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data, 201)
})
