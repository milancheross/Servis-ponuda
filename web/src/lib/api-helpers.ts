import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { supabase } from './supabase'

type Handler = (req: NextRequest, userId: string, ctx: { params: Record<string, string> }) => Promise<NextResponse>
type AdminHandler = (req: NextRequest, userId: string, ctx: { params: Record<string, string> }) => Promise<NextResponse>

// Throttled last_active_at tracking — at most one DB write per user per 15 min per instance
const lastActiveWrites = new Map<string, number>()
const ACTIVE_THROTTLE_MS = 15 * 60 * 1000

function touchLastActive(userId: string) {
  const now = Date.now()
  const last = lastActiveWrites.get(userId)
  if (last && now - last < ACTIVE_THROTTLE_MS) return
  lastActiveWrites.set(userId, now)
  // fire-and-forget — never block the request on this
  supabase
    .from('users')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId)
    .then(({ error }) => {
      if (error) console.error('[last_active_at]', error.message)
    })
}

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    try {
      const cookieToken = req.cookies.get('sp_token')?.value
      const headerToken = req.headers.get('authorization')?.replace('Bearer ', '')
      const token = cookieToken || headerToken

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      touchLastActive(payload.userId)
      return await handler(req, payload.userId, ctx)
    } catch (e: any) {
      console.error('[API Error]', e)
      return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
  }
}

export function withAdminAuth(handler: AdminHandler) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    try {
      const cookieToken = req.cookies.get('sp_token')?.value
      const headerToken = req.headers.get('authorization')?.replace('Bearer ', '')
      const token = cookieToken || headerToken

      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const payload = await verifyToken(token)
      if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return await handler(req, payload.userId, ctx)
    } catch (e: any) {
      console.error('[Admin API Error]', e)
      return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
