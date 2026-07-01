export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAdminAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAdminAuth(async (_req: NextRequest, adminId: string, ctx) => {
  const id = ctx.params.id

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, company_name, phone, pib, address, role, plan, subscription_status, trial_ends_at, last_active_at, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !user) return err('Korisnik nije pronađen', 404)

  const [{ count: quote_count }, { count: invoice_count }, { count: client_count }] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', id),
  ])

  return ok({ user, stats: { quote_count, invoice_count, client_count } })
})

const VALID_PLANS = ['free', 'trial', 'starter', 'pro']
const VALID_STATUSES = ['free', 'trialing', 'active', 'past_due', 'canceled']

export const PATCH = withAdminAuth(async (req: NextRequest, adminId: string, ctx) => {
  const id = ctx.params.id
  const body = await req.json()
  const { plan, subscription_status, trial_ends_at } = body

  if (plan && !VALID_PLANS.includes(plan)) return err('Nevažeći plan')
  if (subscription_status && !VALID_STATUSES.includes(subscription_status)) return err('Nevažeći status')
  if (trial_ends_at && isNaN(Date.parse(trial_ends_at))) return err('Nevažeći datum za trial')

  const updates: Record<string, any> = {}
  if (plan) updates.plan = plan
  if (subscription_status) updates.subscription_status = subscription_status
  if (trial_ends_at !== undefined) updates.trial_ends_at = trial_ends_at || null

  if (Object.keys(updates).length === 0) return err('Nema promena za čuvanje')

  // Fetch old values so the audit log records the full transition
  const { data: before } = await supabase
    .from('users')
    .select('plan, subscription_status, trial_ends_at')
    .eq('id', id)
    .maybeSingle()

  if (!before) return err('Korisnik nije pronađen', 404)

  const { error } = await supabase.from('users').update(updates).eq('id', id)
  if (error) return err('DB greška', 500)

  const { error: auditError } = await supabase.from('admin_audit_log').insert({
    admin_user_id: adminId,
    target_user_id: id,
    action_type: 'update_plan_status',
    metadata: { before, after: updates },
  })
  if (auditError) console.error('[audit_log]', auditError.message)

  return ok({ ok: true })
})
