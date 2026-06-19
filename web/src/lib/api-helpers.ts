import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

type Handler = (req: NextRequest, userId: string, ctx: { params: Record<string, string> }) => Promise<NextResponse>

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
      return await handler(req, payload.userId, ctx)
    } catch (e: any) {
      console.error('[API Error]', e)
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
