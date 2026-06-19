import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name, phone, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return err(error.message, 500)
  const mapped = (data || []).map((inv: any) => ({ ...inv, total: inv.total_amount }))
  return ok(mapped)
})
