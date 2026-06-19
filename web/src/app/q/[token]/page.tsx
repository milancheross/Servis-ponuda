import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QuotePortalClient from './QuotePortalClient'

async function getQuote(token: string) {
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(id, name, phone, email, address), users(company_name, phone, email, address, pib)')
    .eq('tracking_token', token)
    .maybeSingle()

  if (error || !quote) return null
  if (!quote.opened_at) await supabase.from('quotes').update({ opened_at: new Date().toISOString() }).eq('id', quote.id)

  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id)
  return { ...quote, client: (quote as any).clients ?? null, company: (quote as any).users ?? null, items: items || [], total: quote.total_amount }
}

export default async function QuotePortalPage({ params }: { params: { token: string } }) {
  const quote = await getQuote(params.token)
  if (!quote) notFound()
  return <QuotePortalClient quote={quote} token={params.token} />
}
