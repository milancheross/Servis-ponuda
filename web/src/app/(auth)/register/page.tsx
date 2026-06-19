'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', company_name: '', phone: '', address: '', pib: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() })
      router.replace('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900">Kreirajte nalog</h1>
          <p className="text-gray-500 text-sm mt-1">Besplatno, bez kreditne kartice</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'company_name', label: 'Naziv firme / ime', placeholder: 'Milan Servis d.o.o.', required: true },
            { key: 'email', label: 'Email', placeholder: 'vas@email.com', required: true, type: 'email' },
            { key: 'password', label: 'Lozinka', placeholder: '••••••••', required: true, type: 'password' },
            { key: 'phone', label: 'Telefon', placeholder: '+381 60 123 4567' },
            { key: 'address', label: 'Adresa', placeholder: 'Ul. Cara Lazara 12, Beograd' },
            { key: 'pib', label: 'PIB (opcionalno)', placeholder: '123456789' },
          ].map(({ key, label, placeholder, required, type = 'text' }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={set(key)}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
              />
            </div>
          ))}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2563EB] text-white rounded-lg py-3 font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Kreiranje naloga...' : 'Kreiraj nalog'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Već imate nalog?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Prijavite se
          </Link>
        </p>
      </div>
    </div>
  )
}
