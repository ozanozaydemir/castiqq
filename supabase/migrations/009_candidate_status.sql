-- ──────────────────────────────────────────────────────────────────
-- 009_candidate_status.sql — Adaylar için 'candidate' statusu
-- ──────────────────────────────────────────────────────────────────

-- Mevcut check constraint'i kaldır, genişletilmiş versiyonu ekle
ALTER TABLE auditions DROP CONSTRAINT IF EXISTS auditions_status_check;
ALTER TABLE auditions ADD CONSTRAINT auditions_status_check
  CHECK (status IN ('candidate', 'pending', 'reviewing', 'shortlisted', 'rejected', 'selected'));
