import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-52 lg:w-56 bg-gray-900 text-white flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Admin</div>
          <div className="font-bold text-lg">Servis Ponuda</div>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            <span>👥</span> Korisnici
          </Link>
          <Link href="/admin/audit-log" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors">
            <span>📋</span> Audit Log
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <span>←</span> Nazad na app
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 bg-gray-900 text-white px-4 h-14 shrink-0">
          <div className="font-bold">Admin</div>
          <div className="flex-1" />
          <Link href="/admin/dashboard" className="text-xs text-gray-400 hover:text-white px-2 py-1">📊</Link>
          <Link href="/admin/users" className="text-xs text-gray-400 hover:text-white px-2 py-1">👥</Link>
          <Link href="/admin/audit-log" className="text-xs text-gray-400 hover:text-white px-2 py-1">📋</Link>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white px-2 py-1">← App</Link>
        </div>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
