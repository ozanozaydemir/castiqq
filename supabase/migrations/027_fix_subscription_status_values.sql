-- organizations_subscription_status_check kısıtı Polar'ın gerçek subscription
-- status enum'uyla uyuşmuyordu ('trial' yerine 'trialing', 'cancelled' yerine
-- 'canceled'). Bu yüzden webhook'tan gelen her UPDATE constraint violation ile
-- reddediliyor, supabase-js hatayı fırlatmadığı için de sessizce yutuluyordu —
-- Polar'a 200 dönülüyor ama organizations tablosu hiç güncellenmiyordu.
ALTER TABLE public.organizations
  DROP CONSTRAINT organizations_subscription_status_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status = ANY (ARRAY[
    'active'::text,
    'trialing'::text,
    'canceled'::text,
    'past_due'::text,
    'unpaid'::text,
    'incomplete'::text,
    'incomplete_expired'::text
  ]));
