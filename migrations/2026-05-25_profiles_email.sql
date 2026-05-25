-- ─────────────────────────────────────────────────────────────────────────
-- profiles.email: columna sincronizada con auth.users.email
-- Objetivo: que el tab Admin > Usuarios pueda mostrar el email real
-- sin necesidad de service_role ni Edge Function.
--
-- Mecanismo: triggers AFTER INSERT/UPDATE en auth.users que copian el
-- email a public.profiles. Backfill UPDATE para los profiles existentes.
--
-- Cómo aplicar: pegar este archivo entero en el SQL editor de Supabase
-- (proyecto wvxcqavtjtgvxdvtuvvd) y ejecutar.
--
-- Nota RLS: si la policy actual de profiles permite leer a cualquier
-- usuario autenticado, agregar el email expone los emails ajenos al
-- resto. Verificá las policies de profiles después de correr esta
-- migración. Para restringir lectura completa solo a admins, agregá:
--
--   CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT
--     USING (auth.email() IN (
--       'hi@wapnix.com', 'hi@monkeia.com',
--       'contacto@flowback.cl', 'jimmylavinfeldman@gmail.com'
--     ));
--
-- (más una policy "profiles_self_read" que permita al usuario leer su
-- propio registro, para que la sección Mi cuenta siga funcionando).
-- ─────────────────────────────────────────────────────────────────────────

-- 1. Agregar la columna (idempotente)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Función de sincronización. SECURITY DEFINER porque el trigger se
--    dispara en auth.users (esquema protegido) y necesita poder escribir
--    en public.profiles. Hace UPSERT así sirve tanto cuando el profile
--    todavía no existe (signup) como cuando ya existe (cambio de email).
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- 3. Triggers en auth.users — uno para signup, otro para cambio de email
DROP TRIGGER IF EXISTS trg_sync_profile_email_ins ON auth.users;
CREATE TRIGGER trg_sync_profile_email_ins
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

DROP TRIGGER IF EXISTS trg_sync_profile_email_upd ON auth.users;
CREATE TRIGGER trg_sync_profile_email_upd
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_profile_email();

-- 4. Backfill: poblar email en profiles existentes desde auth.users
UPDATE public.profiles p
SET    email = u.email
FROM   auth.users u
WHERE  p.user_id = u.id
  AND  p.email IS NULL;

-- 5. Verificación rápida (descomentar para correr manualmente)
-- SELECT user_id, email, full_name, tier FROM public.profiles ORDER BY created_at DESC LIMIT 10;
