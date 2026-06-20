import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

const PUBLIC_PAGES = ['/login', '/register', '/q/']
const PUBLIC_API = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/q/',
  '/api/health',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/') return NextResponse.next()

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    PUBLIC_PAGES.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // Protect API routes — only public ones pass without token
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API.some(p => pathname.startsWith(p))) return NextResponse.next()

    const token =
      req.cookies.get('sp_token')?.value ||
      req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
      await jwtVerify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Protect dashboard pages
  const token = req.cookies.get('sp_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-servis-ponuda\.png).*)'],
}
