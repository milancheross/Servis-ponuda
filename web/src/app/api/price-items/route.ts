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
  if (!name || typeof name !== 'string' || name.trim().length === 0) return err('Naziv je obavezan')
  if (!unit || typeof unit !== 'string') return err('Jedinica mere je obavezna')
  if (name.length > 500) return err('Naziv je predugačak (max 500 karaktera)')
  if (typeof price !== 'number' || price < 0 || !isFinite(price)) return err('Cena mora biti pozitivan broj')
  if (price > 100_000_000) return err('Cena je prevelika')

  const { data, error } = await supabase
    .from('price_items')
    .insert({ user_id: userId, name: name.trim(), unit: unit.trim(), price, category: category || 'ostalo', is_active: true })
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data, 201)
})
