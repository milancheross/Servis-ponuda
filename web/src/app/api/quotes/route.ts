import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const GET = withAuth(async (req, userId) => {
  const { searchParams } = new URL(req.url)
  const reminders = searchParams.get('reminders')

  if (reminders) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, client:clients(id,name,phone)')
      .eq('user_id', userId)
      .eq('status', 'poslata')
      .lte('sent_at', sevenDaysAgo)
      .order('sent_at', { ascending: true })
    if (error) return err(error.message, 500)
    return ok({ quotes: (data || []).map((q: any) => ({ ...q, total: q.total_amount })) })
  }

  const { searchParams: sp } = new URL(req.url)
  const status = sp.get('status')
  let query = supabase
    .from('quotes')
    .select('*, client:clients(id,name,phone,email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok({ quotes: (data || []).map((q: any) => ({ ...q, total: q.total_amount })) })
})

export const POST = withAuth(async (req, userId) => {
  const body = await req.json()
  const { items, discount_percent = 0, note, valid_until, client_id } = body
  if (!client_id) return err('Klijent je obavezan')

  const subtotal = (items || []).reduce((s: number, i: any) => s + i.quantity * i.price, 0)
  const total_amount = Math.round(subtotal * (1 - discount_percent / 100) * 100) / 100

  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const quote_number = `SP-${year}-${String((count || 0) + 1).padStart(3, '0')}`

  const { v4: uuidv4 } = await import('uuid')
  const insertData: Record<string, any> = {
    user_id: userId, client_id, status: 'nacrt',
    total_amount, tracking_token: uuidv4(), quote_number,
  }
  if (note) insertData.note = note
  if (valid_until) insertData.valid_until = valid_until
  if (discount_percent) insertData.discount_percent = discount_percent

  const { data: quote, error } = await supabase.from('quotes').insert(insertData).select().single()
  if (error) return err(error.message, 500)

  if (items?.length) {
    const { error: ie } = await supabase.from('quote_items').insert(
      items.map((i: any) => ({
        quote_id: quote.id,
        name: i.name, unit: i.unit,
        quantity: i.quantity, price: i.price,
        total: i.quantity * i.price,
        category: i.category || 'ostalo',
      }))
    )
    if (ie) return err(ie.message, 500)
  }

  return ok({ quote: { ...quote, total: total_amount } }, 201)
})
