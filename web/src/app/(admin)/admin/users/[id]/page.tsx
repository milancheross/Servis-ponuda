export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import AdminUserActions from './AdminUserActions'

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="text-sm text-gray-500 w-36 shrink-0">{label}</div>
      <div className="text-sm text-gray-900 break-all">{value ?? '—'}</div>
    </div>
  )
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, company_name, phone, pib, address, role, plan, subscription_status, trial_ends_at, last_active_at, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !user) notFound()

  const [{ count: quote_count }, { count: invoice_count }, { count: client_count }] = await Promise.all([
    supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', params.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', params.id),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', params.id),
  ])

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="mb-4">
        <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-800">← Nazad na listu</Link>
      </div>
      <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 break-all">{user.email}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-5">
          <div className="text-xs text-gray-400 uppercase font-bold mb-3">Info o nalogu</div>
          <Row label="Email" value={user.email} />
          <Row label="Kompanija" value={user.company_name} />
          <Row label="Telefon" value={user.phone} />
          <Row label="PIB" value={user.pib} />
          <Row label="Role" value={user.role} />
          <Row label="Registrovan" value={user.created_at ? new Date(user.created_at).toLocaleDateString('sr-RS') : null} />
          <Row label="Poslednja aktivnost" value={user.last_active_at ? new Date(user.last_active_at).toLocaleDateString('sr-RS') : null} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 md:p-5">
          <div className="text-xs text-gray-400 uppercase font-bold mb-3">Plan i pretplata</div>
          <Row label="Plan" value={user.plan} />
          <Row label="Status" value={user.subscription_status} />
          <Row label="Trial do" value={user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleDateString('sr-RS') : null} />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 uppercase font-bold mb-3">Korišćenje</div>
            <Row label="Ponude" value={quote_count ?? 0} />
            <Row label="Fakture" value={invoice_count ?? 0} />
            <Row label="Klijenti" value={client_count ?? 0} />
          </div>
        </div>
      </div>

      <AdminUserActions
        userId={user.id}
        currentPlan={user.plan || 'free'}
        currentStatus={user.subscription_status || 'free'}
        currentTrialEnd={user.trial_ends_at}
      />
    </div>
  )
}
