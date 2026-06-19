import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'
import { v4 as uuidv4 } from 'uuid'

export const GET = withAuth(async (req, userId) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  let query = supabase
    .from('quotes')
    .select('*, client:clients(id,name,phone,email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const { data, error } = await query
  if (error) return err(error.message, 500)
  return ok({ quotes: data })
})

export const POST = withAuth(async (req, userId) => {
  const body = await req.json()
  const { items, discount_percent = 0, note, valid_until, client_id } = body
  if (!client_id) return err('Klijent je obavezan')
  const subtotal = (items || []).reduce((s: number, i: any) => s + i.quantity * i.price, 0)
  const total = subtotal * (1 - discount_percent / 100)

  const insertData: Record<string, any> = {
    user_id: userId,
    client_id,
    status: 'nacrt',
    total_amount: total,
    total,
    tracking_token: uuidv4(),
  }
  if (note) insertData.note = note
  if (valid_until) insertData.valid_until = valid_until
  if (discount_percent) insertData.discount_percent = discount_percent

  const { data: quote, error } = await supabase
    .from('quotes')
    .insert(insertData)
    .select()
    .single()
  if (error) return err(error.message, 500)

  if (items?.length) {
    const { error: itemsError } = await supabase.from('quote_items').insert(
      items.map((i: any) => ({
        quote_id: quote.id,
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        price: i.price,
        total: i.quantity * i.price,
      }))
    )
    if (itemsError) return err(itemsError.message, 500)
  }

  return ok({ quote }, 201)
})
