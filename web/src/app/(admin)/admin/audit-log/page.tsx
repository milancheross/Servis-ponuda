export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'

const PAGE_SIZE = 50

export default async function AdminAuditLogPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || '1', 10)
  const offset = (page - 1) * PAGE_SIZE

  const { data: logs, count } = await supabase
    .from('admin_audit_log')
    .select('id, action_type, metadata, created_at, admin_user_id, target_user_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const allIds = [...new Set([
    ...(logs || []).map(l => l.admin_user_id),
    ...(logs || []).map(l => l.target_user_id),
  ].filter(Boolean))]

  let emailMap: Record<string, string> = {}
  if (allIds.length) {
    const { data: users } = await supabase.from('users').select('id, email').in('id', allIds)
    for (const u of users || []) emailMap[u.id] = u.email
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Vreme</th>
              <th className="px-4 py-3 text-left">Admin</th>
              <th className="px-4 py-3 text-left">Korisnik</th>
              <th className="px-4 py-3 text-left">Akcija</th>
              <th className="px-4 py-3 text-left">Detalji</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!logs?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nema zapisa</td></tr>
            )}
            {(logs || []).map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {log.created_at ? new Date(log.created_at).toLocaleString('sr-RS') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{log.admin_user_id ? (emailMap[log.admin_user_id] || log.admin_user_id.slice(0, 8)) : '—'}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{log.target_user_id ? (emailMap[log.target_user_id] || log.target_user_id.slice(0, 8)) : '—'}</td>
                <td className="px-4 py-3">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap">{log.action_type}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono max-w-[160px] truncate">
                  {log.metadata && Object.keys(log.metadata).length > 0 ? JSON.stringify(log.metadata) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4 justify-end flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a key={p} href={`?page=${p}`}
              className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
