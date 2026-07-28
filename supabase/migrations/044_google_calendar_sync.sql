-- ──────────────────────────────────────────────────────────────────
-- 044_google_calendar_sync.sql — Google Calendar booking senkronizasyonu
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

ALTER TABLE public.google_connections
  ADD COLUMN IF NOT EXISTS calendar_id TEXT;
