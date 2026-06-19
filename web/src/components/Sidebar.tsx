'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <>
      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden md:flex w-56 min-h-screen bg-[#1e3a8a] flex-col print:hidden shrink-0">
        <div className="px-5 py-6 border-b border-blue-700">
          <div className="text-white font-bold text-lg leading-tight">Servis Ponuda</div>
          {user && <div className="text-blue-300 text-xs mt-1 truncate">{user.company_name}</div>}
        </div>
        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                isActive(href) ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-blue-700">
          <button onClick={logout} className="w-full text-left text-blue-300 hover:text-white text-sm py-2 transition-colors">
            ↩ Odjavi se
          </button>
        </div>
      </aside>

      {/* ===== MOBILE TOP BAR ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1e3a8a] flex items-center justify-between px-4 h-14 print:hidden">
        <div>
          <div className="text-white font-bold text-base">Servis Ponuda</div>
          {user && <div className="text-blue-300 text-xs truncate max-w-[180px]">{user.company_name}</div>}
        </div>
        <button onClick={() => setMenuOpen(o => !o)} className="text-white p-2 rounded-lg hover:bg-blue-800" aria-label="Meni">
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 print:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <nav className="absolute top-14 left-0 right-0 bg-[#1e3a8a] shadow-xl" onClick={e => e.stopPropagation()}>
            {NAV.map(({ href, label, icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 text-base font-medium border-b border-blue-800 ${
                  isActive(href) ? 'bg-blue-700 text-white' : 'text-blue-200'
                }`}>
                <span className="text-xl">{icon}</span>{label}
              </Link>
            ))}
            <button onClick={() => { logout(); setMenuOpen(false) }}
              className="w-full flex items-center gap-4 px-6 py-4 text-base font-medium text-blue-300">
              <span className="text-xl">↩</span> Odjavi se
            </button>
          </nav>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex print:hidden">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
              isActive(href) ? 'text-[#2563EB]' : 'text-gray-400'
            }`}>
            <span className="text-xl mb-0.5">{icon}</span>
            <span className="leading-none">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
