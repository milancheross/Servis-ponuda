'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

const NAV_LINKS = [
  { href: '#kako-radi', label: 'Kako radi' },
  { href: '#funkcionalnosti', label: 'Funkcionalnosti' },
  { href: '#cene', label: 'Cene' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#1e3a8a] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">SP</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Servis Ponuda</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="text-gray-600 hover:text-[#1e3a8a] text-sm font-medium transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoading && (
            user ? (
              <Link href="/home" className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors">
                Idi na dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-[#1e3a8a] text-sm font-medium transition-colors">
                  Prijava
                </Link>
                <Link href="/register" className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors">
                  Isprobaj besplatno
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden p-2 text-gray-600" aria-label="Meni">
          {open ? (
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

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block text-gray-700 font-medium py-2 border-b border-gray-50">
              {l.label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            {!isLoading && (
              user ? (
                <Link href="/home" onClick={() => setOpen(false)}
                  className="block w-full text-center bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold">
                  Idi na dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block w-full text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold">
                    Prijava
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}
                    className="block w-full text-center bg-[#1e3a8a] text-white py-3 rounded-xl font-semibold">
                    Isprobaj besplatno
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      )}
    </header>
  )
}
