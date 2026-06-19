import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAuth(async (req, userId) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase
    .from('invoices')
    .select('*, client:clients(id,name,phone,email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return err(error.message, 500)
  const invoices = (data || []).map((i: any) => ({ ...i, total: i.total_amount }))
  return ok({ invoices })
})
