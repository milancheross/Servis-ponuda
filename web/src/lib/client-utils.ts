export const LEGAL_FORM_LABELS: Record<string, string> = {
  doo: 'DOO',
  entrepreneur: 'Preduzetnik',
  other: 'Ostalo',
  unknown: 'Nepoznato',
}

export const VAT_STATUS_LABELS: Record<string, string> = {
  in_vat: 'U sistemu PDV-a',
  out_of_vat: 'Nije u sistemu PDV-a',
  unknown: 'Nepoznato',
}

export const ENTREPRENEUR_TAX_MODE_LABELS: Record<string, string> = {
  lump_sum: 'Paušalac',
  books: 'Knjigaš',
  unknown: 'Nepoznato',
}

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  immediately: 'Odmah',
  advance: 'Avansno',
  '7_days': '7 dana',
  '15_days': '15 dana',
  '30_days': '30 dana',
  custom: 'Po dogovoru',
  unknown: 'Nije definisano',
}

export const INVOICE_PREFERENCE_LABELS: Record<string, string> = {
  simple_consumer: 'Obična naplata (fizičko lice)',
  business_invoice: 'Faktura na firmu',
  unknown: 'Nije definisano',
}

export const PRICE_DISPLAY_MODE_LABELS: Record<string, string> = {
  total_only: 'Samo ukupna cena',
  subtotal_vat_total: 'Osnovica + PDV + ukupno',
  unknown: 'Nije definisano',
}

export function clientDisplayName(client: { name?: string; company_name?: string; client_type?: string } | null | undefined): string {
  if (!client) return '—'
  if (client.client_type === 'business') return client.company_name || client.name || '—'
  return client.name || '—'
}
