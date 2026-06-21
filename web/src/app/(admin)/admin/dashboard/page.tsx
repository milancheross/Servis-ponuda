export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default async function AdminDashboard() {
  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: total_users },
    { count: new_users_7d },
    { count: active_users_7d },
    { count: total_quotes },
    { count: total_invoices },
    { count: pro_users },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', since7d),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_active_at', since7d),
    supabase.from('quotes').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'pro').eq('subscription_status', 'active'),
  ])

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="Ukupno korisnika" value={total_users ?? 0} />
        <KpiCard label="Novi (7d)" value={new_users_7d ?? 0} />
        <KpiCard label="Aktivni (7d)" value={active_users_7d ?? 0} />
        <KpiCard label="Ukupno ponuda" value={total_quotes ?? 0} />
        <KpiCard label="Ukupno faktura" value={total_invoices ?? 0} />
        <KpiCard label="Plan: Pro" value={pro_users ?? 0} sub="aktivnih pretplata" />
      </div>
    </div>
  )
}
