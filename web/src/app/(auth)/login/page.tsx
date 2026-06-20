'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import BrandLogo from '@/components/shared/BrandLogo'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
      router.replace('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="flex flex-col items-center mb-8">
        <BrandLogo size="lg" href="/" className="mb-4" />
        <p className="text-gray-500 text-sm">Prijavite se na vaš nalog</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vas@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e3a8a] text-white rounded-lg py-3 font-semibold text-sm hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {loading ? 'Prijava...' : 'Prijavi se'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Nemate nalog?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:underline">
          Registrujte se
        </Link>
      </p>
    </div>
  )
}
