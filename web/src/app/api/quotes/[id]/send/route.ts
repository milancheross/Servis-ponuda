import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth, ok, err } from '@/lib/api-helpers'

export const POST = withAuth(async (req: NextRequest, userId, { params }) => {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status: 'poslata', sent_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return err(error.message, 500)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const tracking_url = data.tracking_token ? `${appUrl}/q/${data.tracking_token}` : null

  return ok({ quote: { ...data, total: data.total_amount }, tracking_url })
})
