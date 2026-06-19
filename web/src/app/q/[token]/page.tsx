import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import QuotePortalClient from './QuotePortalClient'

export const dynamic = 'force-dynamic'

export default async function QuotePortalPage({ params }: { params: { token: string } }) {
  const { token } = params

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, client:clients(name, address, phone, email)')
    .eq('tracking_token', token)
    .single()

  if (error || !quote) notFound()

  if (!quote.opened_at) {
    await supabase.from('quotes').update({ opened_at: new Date().toISOString() }).eq('id', quote.id)
  }

  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id).order('created_at')
  const { data: company } = await supabase.from('users').select('company_name, address, phone, pib').eq('id', quote.user_id).single()

  return (
    <QuotePortalClient
      token={token}
      quote={{ ...quote, total: quote.total_amount }}
      items={items || []}
      company={company}
    />
  )
}
