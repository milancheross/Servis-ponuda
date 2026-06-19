import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

type Handler = (req: NextRequest, userId: string, ctx: { params: Record<string, string> }) => Promise<NextResponse>

export function withAuth(handler: Handler) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = verifyToken(authHeader.slice(7))
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return handler(req, payload.userId, ctx)
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}
