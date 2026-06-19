import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const runtime = 'nodejs'

export const POST = withAuth(async (req, userId, ctx) => {
  const { id } = ctx.params
  const { data: quote, error: fetchErr } = await supabase
    .from('quotes')
    .select('tracking_token')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (fetchErr) return err(fetchErr.message, 404)

  const { data, error } = await supabase
    .from('quotes')
    .update({ status: 'poslata', sent_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
  const tracking_url = `${origin}/q/${quote.tracking_token}`

  return ok({ ...data, total: data.total_amount, tracking_url })
})
