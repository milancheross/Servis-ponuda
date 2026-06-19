'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '@/lib/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: Record<string, string>) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API = '/api'

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...(options.headers as any) } })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || body.message || 'Greška')
  return body
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const restoreSession = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('sp_token') : null
    if (!stored) { setIsLoading(false); return }
    try {
      const { user } = await apiFetch<{ user: User }>('/auth/profile', {}, stored)
      setToken(stored)
      setUser(user)
    } catch {
      localStorage.removeItem('sp_token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { restoreSession() }, [restoreSession])

  const login = async (email: string, password: string) => {
    const { token: t, user: u } = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('sp_token', t)
    setToken(t)
    setUser(u)
  }

  const register = async (data: Record<string, string>) => {
    const { token: t, user: u } = await apiFetch<{ token: string; user: User }>('/auth/register', {
      method: 'POST', body: JSON.stringify(data),
    })
    localStorage.setItem('sp_token', t)
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('sp_token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (!token) return
    const { user: u } = await apiFetch<{ user: User }>('/auth/profile', {}, token)
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
