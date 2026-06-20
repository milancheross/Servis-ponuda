import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req, userId) => {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    clientsRes,
    quotesMonthRes,
    unpaidRes,
    remindersRes,
    recentQuotesRes,
  ] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', monthStart.toISOString()),
    supabase.from('invoices').select('total_amount').eq('user_id', userId).eq('status', 'neplaceno'),
    supabase.from('quotes')
      .select('id, quote_number, total_amount, sent_at, client:clients(name)')
      .eq('user_id', userId)
      .eq('status', 'poslata')
      .lt('sent_at', sevenDaysAgo),
    supabase.from('quotes')
      .select('id, quote_number, status, total_amount, created_at, client:clients(id, name, company_name, client_type)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (clientsRes.error) return err(clientsRes.error.message, 500)

  const unpaidInvoices = unpaidRes.data || []
  const unpaidTotal = unpaidInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0)

  return ok({
    clientCount: clientsRes.count || 0,
    quotesThisMonth: quotesMonthRes.count || 0,
    unpaidCount: unpaidInvoices.length,
    unpaidTotal,
    reminders: (remindersRes.data || []).map(q => ({
      ...q,
      total: q.total_amount,
    })),
    recentQuotes: (recentQuotesRes.data || []).map(q => ({
      ...q,
      total: q.total_amount,
    })),
  })
})
