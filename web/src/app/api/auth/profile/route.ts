export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, company_name, phone, address, pib, logo_url, created_at, role, plan, subscription_status, trial_ends_at')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return err('Korisnik nije pronađen', 404)
  return ok({ user: data })
})

export const PUT = withAuth(async (req, userId) => {
  const body = await req.json()
  const allowed = ['company_name', 'phone', 'address', 'pib', 'logo_url']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, company_name, phone, address, pib, logo_url, created_at')
    .single()
  if (error) return err(error.message, 500)
  return ok({ user: data })
})
