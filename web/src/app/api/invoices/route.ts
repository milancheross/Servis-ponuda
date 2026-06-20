import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (req, userId) => {
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0')

  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name, phone, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return err(error.message, 500)
  const mapped = (data || []).map(inv => ({ ...inv, total: inv.total_amount }))
  return ok(mapped)
})
