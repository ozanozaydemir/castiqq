-- ──────────────────────────────────────────────────────────────────
-- 049_role_shares_reminder.sql — süre dolumu hatırlatması yalnızca bir
-- kez gönderilsin diye işaret kolonu
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.role_shares
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
