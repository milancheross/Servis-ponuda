import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAuth(async (_req, userId, { params }) => {
  const { data, error } = await supabase
    .from('client_activities')
    .select('*')
    .eq('client_id', params.id)
    .eq('user_id', userId)
    .order('activity_date', { ascending: false })
  if (error) return err(error.message, 500)
  return ok({ activities: data })
})

export const POST = withAuth(async (req, userId, { params }) => {
  const body = await req.json()
  if (!body.type) return err('Tip aktivnosti je obavezan')
  const { data, error } = await supabase
    .from('client_activities')
    .insert({
      user_id: userId,
      client_id: params.id,
      type: body.type,
      note: body.note || null,
      activity_date: body.activity_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single()
  if (error) return err(error.message, 500)
  return ok({ activity: data }, 201)
})
