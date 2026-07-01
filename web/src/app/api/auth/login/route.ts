export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { comparePassword, signToken, checkRateLimit, isValidEmail } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email i lozinka su obavezni' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Nevalidan format emaila' }, { status: 400 })
    }

    // Rate limit: 5 attempts per minute per email
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const key = `login:${email.toLowerCase()}:${ip}`
    if (!checkRateLimit(key, 5, 60_000)) {
      return NextResponse.json({ error: 'Previše pokušaja. Sačekajte minut pa pokušajte ponovo.' }, { status: 429 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, company_name, phone, address, pib, logo_url, created_at, role')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (error || !user) {
      return NextResponse.json({ error: 'Pogrešan email ili lozinka' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Pogrešan email ili lozinka' }, { status: 401 })
    }

    const { password_hash: _, ...safeUser } = user
    const token = await signToken(user.id, user.role || 'user')

    // Track activity on login (fire-and-forget)
    supabase.from('users').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
      .then(() => {})

    // Return token in body for mobile clients; also set httpOnly cookie for web
    const res = NextResponse.json({ user: safeUser, token })
    res.cookies.set('sp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
