'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const NAV = [
  { href: '/', label: 'Početna', icon: '🏠' },
  { href: '/clients', label: 'Klijenti', icon: '👥' },
  { href: '/quotes', label: 'Ponude', icon: '📋' },
  { href: '/invoices', label: 'Fakture', icon: '🧾' },
  { href: '/price-items', label: 'Cenovnik', icon: '💰' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 min-h-screen bg-[#1e3a8a] flex flex-col print:hidden">
      <div className="px-5 py-6 border-b border-blue-700">
        <div className="text-white font-bold text-lg leading-tight">Servis Ponuda</div>
        {user && <div className="text-blue-300 text-xs mt-1 truncate">{user.company_name}</div>}
      </div>
      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-blue-700">
        <button
          onClick={logout}
          className="w-full text-left text-blue-300 hover:text-white text-sm py-2 transition-colors"
        >
          ↩ Odjavi se
        </button>
      </div>
    </aside>
  )
}
