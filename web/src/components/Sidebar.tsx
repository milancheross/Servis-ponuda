'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', label: 'Početna', icon: '🏠' },
  { href: '/clients', label: 'Klijenti', icon: '👥' },
  { href: '/quotes', label: 'Ponude', icon: '📋' },
  { href: '/invoices', label: 'Fakture', icon: '💰' },
  { href: '/price-items', label: 'Cenovnik', icon: '📊' },
]

export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#1e3a8a] text-white">
        <div className="p-4 text-xl font-bold border-b border-blue-800">Servis Ponuda</div>
        <nav className="flex-1 p-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-sm font-medium transition-colors ${pathname === item.href ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1e3a8a] text-white flex items-center px-4 z-40">
        <button onClick={() => setDrawerOpen(true)} className="mr-3 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-lg">Servis Ponuda</span>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-64 bg-[#1e3a8a] text-white flex flex-col">
            <div className="p-4 text-xl font-bold border-b border-blue-800 flex items-center justify-between">
              <span>Servis Ponuda</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1">✕</button>
            </div>
            <nav className="flex-1 p-2">
              {navItems.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium transition-colors ${pathname === item.href ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-40">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${pathname === item.href ? 'text-blue-800 font-semibold' : 'text-gray-500'}`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
