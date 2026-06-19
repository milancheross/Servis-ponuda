import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return err(error.message, 500)
  return ok(data)
})

export const POST = withAuth(async (req, userId) => {
  const body = await req.json()
  const { name, phone, email, address } = body
  if (!name) return err('Ime klijenta je obavezno')
  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, name, phone, email, address })
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok(data, 201)
})
