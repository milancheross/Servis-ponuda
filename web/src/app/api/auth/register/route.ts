import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, company_name, phone, address, pib } = await req.json()
    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Email, lozinka i naziv firme su obavezni' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Korisnik sa tim emailom već postoji' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const { data: user, error } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase(), password_hash, company_name, phone, address, pib })
      .select('id, email, company_name, phone, address, pib, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const token = signToken(user.id)
    const res = NextResponse.json({ user }, { status: 201 })
    res.cookies.set('sp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (e: any) {
    console.error('[register]', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
