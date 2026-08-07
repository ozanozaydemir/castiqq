-- 061_audition_rounds.sql — Callback / tur sistemi
-- auditions.current_round: CD'nin sonraki upload için açtığı tur numarası
-- audition_videos.round: video yüklenirken o anki current_round snapshot'ı

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS current_round SMALLINT NOT NULL DEFAULT 1
    CHECK (current_round BETWEEN 1 AND 10);

ALTER TABLE public.audition_videos
  ADD COLUMN IF NOT EXISTS round SMALLINT NOT NULL DEFAULT 1
    CHECK (round BETWEEN 1 AND 10);
