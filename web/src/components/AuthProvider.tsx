'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: Record<string, string>) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || body.message || 'Greška')
  return body
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const restoreSession = useCallback(async () => {
    try {
      const { user } = await apiFetch<{ user: User }>('/auth/profile')
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { restoreSession() }, [restoreSession])

  const login = async (email: string, password: string) => {
    const { user: u } = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(u)
    router.push('/')
  }

  const register = async (data: Record<string, string>) => {
    const { user: u } = await apiFetch<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    setUser(u)
    router.push('/')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    const { user: u } = await apiFetch<{ user: User }>('/auth/profile')
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
