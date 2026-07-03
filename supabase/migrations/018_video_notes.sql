-- Timestamp-anchored notes on audition videos
CREATE TABLE IF NOT EXISTS public.video_notes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id)      ON DELETE CASCADE,
  audition_video_id UUID NOT NULL REFERENCES public.audition_videos(id)    ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.profiles(id)           ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  note              TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "video_notes: org isolation"
  ON public.video_notes
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.video_notes TO authenticated;
