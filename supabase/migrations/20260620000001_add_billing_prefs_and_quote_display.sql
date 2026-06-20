-- Migration: billing/commercial preferences on clients + price display on quotes
-- Run manually in Supabase SQL Editor

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS billing_notes text,
  ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'unknown'
    CHECK (payment_terms IN ('immediately', 'advance', '7_days', '15_days', '30_days', 'custom', 'unknown')),
  ADD COLUMN IF NOT EXISTS payment_terms_note text,
  ADD COLUMN IF NOT EXISTS invoice_preference text DEFAULT 'unknown'
    CHECK (invoice_preference IN ('simple_consumer', 'business_invoice', 'unknown')),
  ADD COLUMN IF NOT EXISTS preferred_price_display_mode text DEFAULT 'unknown'
    CHECK (preferred_price_display_mode IN ('total_only', 'subtotal_vat_total', 'unknown'));

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS price_display_mode text DEFAULT 'total_only'
    CHECK (price_display_mode IN ('total_only', 'subtotal_vat_total')),
  ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'unknown'
    CHECK (payment_terms IN ('immediately', 'advance', '7_days', '15_days', '30_days', 'custom', 'unknown')),
  ADD COLUMN IF NOT EXISTS payment_terms_note text,
  ADD COLUMN IF NOT EXISTS billing_notes_snapshot text;
