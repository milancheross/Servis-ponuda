-- Fix contradiction: admin_user_id was NOT NULL but had ON DELETE SET NULL,
-- which would make deleting an admin user fail. Allow NULL (log survives admin deletion).
ALTER TABLE admin_audit_log ALTER COLUMN admin_user_id DROP NOT NULL;

-- Index for the "active users in last 7 days" KPI
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at DESC);
