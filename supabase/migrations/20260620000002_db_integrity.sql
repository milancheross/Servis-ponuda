-- Performance indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_tracking_token ON quotes(tracking_token);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_price_items_user_id ON price_items(user_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);

-- Unique constraints to prevent duplicate quote/invoice numbers per user
ALTER TABLE quotes
  ADD CONSTRAINT IF NOT EXISTS uq_quotes_user_number UNIQUE (user_id, quote_number);

ALTER TABLE invoices
  ADD CONSTRAINT IF NOT EXISTS uq_invoices_user_number UNIQUE (user_id, invoice_number);

-- Foreign key: quote_items must belong to an existing quote (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_quote_items_quote' AND table_name = 'quote_items'
  ) THEN
    ALTER TABLE quote_items
      ADD CONSTRAINT fk_quote_items_quote
      FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Foreign key: quotes reference existing clients (restrict delete to prevent orphans)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_quotes_client' AND table_name = 'quotes'
  ) THEN
    ALTER TABLE quotes
      ADD CONSTRAINT fk_quotes_client
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Foreign key: invoices reference existing clients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_invoices_client' AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices
      ADD CONSTRAINT fk_invoices_client
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Check constraints to prevent invalid data
ALTER TABLE quotes
  ADD CONSTRAINT IF NOT EXISTS chk_quotes_discount CHECK (discount_percent >= 0 AND discount_percent <= 100);

ALTER TABLE quote_items
  ADD CONSTRAINT IF NOT EXISTS chk_quote_items_price CHECK (price >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_quote_items_quantity CHECK (quantity > 0);
