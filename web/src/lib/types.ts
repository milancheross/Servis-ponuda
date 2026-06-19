export type QuoteStatus = 'nacrt' | 'poslata' | 'prihvacena' | 'odbijena'
export type InvoiceStatus = 'neplaceno' | 'placeno'
export type PriceCategory = 'rad' | 'materijal' | 'ostalo'

export interface User {
  id: string
  email: string
  company_name: string
  pib?: string
  address?: string
  phone?: string
  logo_url?: string
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  phone?: string
  email?: string
  address?: string
  created_at: string
}

export interface PriceItem {
  id: string
  user_id: string
  name: string
  unit: string
  price: number
  category: PriceCategory
  is_active: boolean
  created_at: string
}

export interface QuoteItem {
  id?: string
  quote_id?: string
  name: string
  unit: string
  quantity: number
  price: number
  total: number
}

export interface Quote {
  id: string
  user_id: string
  client_id: string
  client?: Client | null
  quote_number?: string
  status: QuoteStatus
  total_amount: number
  discount_percent: number
  tracking_token?: string
  sent_at?: string
  opened_at?: string
  signed_by?: string
  signed_at?: string
  signed_ip?: string
  signature_data?: string
  note?: string
  valid_until?: string
  items?: QuoteItem[]
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  client?: Client | null
  quote_id?: string
  invoice_number: string
  status: InvoiceStatus
  total_amount: number
  issued_at: string
  due_date?: string
  items?: QuoteItem[]
  created_at: string
}
