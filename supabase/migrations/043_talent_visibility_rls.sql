-- ──────────────────────────────────────────────────────────────────
-- 043_talent_visibility_rls.sql — Ekip görünürlük ayrımı
-- admin herkesi görür; member sadece kendine atanan + atanmamış
-- oyuncuları görür. Production org'larda assigned_to hiç
-- kullanılmadığı için (her zaman NULL) bu değişiklik onları etkilemez.
-- ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "talent_select" ON public.talent;
CREATE POLICY "talent_select" ON public.talent FOR SELECT
  USING (
    organization_id = get_user_org_id()
    AND (get_user_role() = 'admin' OR assigned_to IS NULL OR assigned_to = auth.uid())
  );

DROP POLICY IF EXISTS "bookings: org isolation" ON public.bookings;
CREATE POLICY "bookings: org isolation" ON public.bookings
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.talent t
      WHERE t.id = bookings.talent_id
        AND (get_user_role() = 'admin' OR t.assigned_to IS NULL OR t.assigned_to = auth.uid())
    )
  )
  WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "talent_documents: org isolation" ON public.talent_documents;
CREATE POLICY "talent_documents: org isolation" ON public.talent_documents
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.talent t
      WHERE t.id = talent_documents.talent_id
        AND (get_user_role() = 'admin' OR t.assigned_to IS NULL OR t.assigned_to = auth.uid())
    )
  )
  WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "talent_advances: org isolation" ON public.talent_advances;
CREATE POLICY "talent_advances: org isolation" ON public.talent_advances
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.talent t
      WHERE t.id = talent_advances.talent_id
        AND (get_user_role() = 'admin' OR t.assigned_to IS NULL OR t.assigned_to = auth.uid())
    )
  )
  WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS "talent_representation_history: org isolation" ON public.talent_representation_history;
CREATE POLICY "talent_representation_history: org isolation" ON public.talent_representation_history
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.talent t
      WHERE t.id = talent_representation_history.talent_id
        AND (get_user_role() = 'admin' OR t.assigned_to IS NULL OR t.assigned_to = auth.uid())
    )
  )
  WITH CHECK (organization_id = get_user_org_id());
