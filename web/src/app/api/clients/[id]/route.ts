import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId, ctx) => {
  const { id } = ctx.params
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error) return err(error.message, 404)
  return ok(data)
})

export const PUT = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const { name, phone, email, address } = await req.json()
  const { data, error } = await supabase
    .from('clients')
    .update({ name, phone, email, address })
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
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return err(error.message, 500)
  return ok({ success: true })
})
