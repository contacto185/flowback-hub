-- ─────────────────────────────────────────────────────────────────────
-- RLS para public.profiles
--
-- Objetivo: garantizar que un usuario autenticado NO pueda leer los
-- profiles de otros (lo que incluiría sus emails ahora que la columna
-- email se sincroniza desde auth.users).
--
-- Reglas:
--   • Lectura propia: el user puede leer su propio row
--   • Lectura admin:  los 4 admins pueden leer todos los rows
--   • Update propio:  el user puede actualizar su propio row
--                     (necesario para editar full_name en Mi cuenta)
--   • Admin total:    los 4 admins pueden hacer cualquier cosa
--                     (necesario para el dropdown de tier en Admin)
--
-- Es idempotente: bloque DO que dropea TODAS las policies actuales de
-- profiles (sin importar el nombre) y recrea las 4 deseadas.
--
-- Cómo aplicar: pegar entero en el SQL editor de Supabase y ejecutar.
-- El SELECT inicial y el final muestran el estado "antes" y "después"
-- en el panel de resultados.
--
-- ⚠ NOTA DE SEGURIDAD APARTE (no resuelta por esta migración):
--   La policy profiles_self_update permite al user actualizar SU PROPIO
--   row incluyendo el campo `tier`. Eso significa que cualquier user
--   logueado puede ponerse premium ejecutando desde la consola del
--   browser:
--       sb.from('profiles').update({tier:'premium'}).eq('user_id', ...)
--   Esto ya existía ANTES de esta migración. Para cerrarlo necesitás
--   una Edge Function que valide el pago real (PayPal capture confirmado)
--   y haga el UPDATE con service_role. Fuera de scope de este SQL.
-- ─────────────────────────────────────────────────────────────────────

-- 0. Asegurar RLS habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Estado actual de policies (para auditar el diff en el output)
SELECT 'BEFORE' AS phase, policyname, cmd,
       qual::text         AS using_expr,
       with_check::text   AS check_expr,
       roles::text        AS roles
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'profiles'
ORDER  BY policyname;

-- 2. Borrar TODAS las policies actuales de profiles (idempotente y agnóstico
--    del nombre que tengan en este proyecto)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM   pg_policies
    WHERE  schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. Lectura: cada user lee su propio row
CREATE POLICY profiles_self_read
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Lectura: los admins leen todos los rows
CREATE POLICY profiles_admin_read
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.email() IN (
    'hi@wapnix.com',
    'hi@monkeia.com',
    'contacto@flowback.cl',
    'jimmylavinfeldman@gmail.com'
  ));

-- 5. Update: cada user actualiza su propio row (Mi cuenta · saveName())
CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Admin total: insert/update/delete sobre cualquier row
--    (Admin > Usuarios · changeUserTier())
CREATE POLICY profiles_admin_full
  ON public.profiles
  FOR ALL
  TO authenticated
  USING      (auth.email() IN (
    'hi@wapnix.com',
    'hi@monkeia.com',
    'contacto@flowback.cl',
    'jimmylavinfeldman@gmail.com'
  ))
  WITH CHECK (auth.email() IN (
    'hi@wapnix.com',
    'hi@monkeia.com',
    'contacto@flowback.cl',
    'jimmylavinfeldman@gmail.com'
  ));

-- 7. Estado final
SELECT 'AFTER' AS phase, policyname, cmd,
       qual::text         AS using_expr,
       with_check::text   AS check_expr,
       roles::text        AS roles
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'profiles'
ORDER  BY policyname;
