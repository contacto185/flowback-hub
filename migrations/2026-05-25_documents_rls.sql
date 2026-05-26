-- ─────────────────────────────────────────────────────────────────────
-- RLS para public.documents
--
-- Síntoma: después de aplicar RLS en profiles, el fetch JS a documents
-- queda colgado y nunca resuelve (no devuelve datos ni error en consola).
-- Probable causa: las policies actuales de documents tienen una subquery
-- a profiles (típico patrón "filtrar por tier_required <= mi tier") que
-- ahora interactúa mal con la RLS nueva de profiles — o bien documents
-- tiene RLS habilitada SIN policy para el role authenticated, lo que
-- haría que el cliente JS espere indefinidamente.
--
-- Solución: reset limpio de policies con
--   • SELECT público de docs activos (is_active = true)
--   • Admin SELECT/INSERT/UPDATE/DELETE total (incluso inactivos)
-- Sin subqueries a profiles → cero dependencias cruzadas. El filtro por
-- tier sigue siendo client-side en loadDocumentos() vía canAccess().
--
-- Idempotente: el DO block dropea TODAS las policies actuales de
-- documents sin importar el nombre. Seguro de ejecutar varias veces.
--
-- Cómo aplicar: pegar entero en el SQL editor de Supabase y ejecutar.
-- Mirar el output del SELECT 'BEFORE' para ver qué había, y el 'AFTER'
-- para confirmar que quedaron 3 policies limpias.
-- ─────────────────────────────────────────────────────────────────────

-- 0. Verificar si RLS está habilitada (informativo)
SELECT relname, relrowsecurity AS rls_enabled
FROM   pg_class
WHERE  relname = 'documents' AND relnamespace = 'public'::regnamespace;

-- 1. Estado actual de policies (audit BEFORE)
SELECT 'BEFORE' AS phase, policyname, cmd,
       roles::text       AS roles,
       qual::text        AS using_expr,
       with_check::text  AS check_expr
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'documents'
ORDER  BY policyname;

-- 2. Asegurar RLS habilitada (idempotente)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Borrar TODAS las policies actuales sin importar el nombre
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM   pg_policies
    WHERE  schemaname = 'public' AND tablename = 'documents'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.documents', pol.policyname);
  END LOOP;
END $$;

-- 4. SELECT público de documentos activos
--    Sin restricción de role → anon y authenticated pueden leer.
--    El filtro por tier_required ocurre client-side en loadDocumentos
--    (canAccess), porque tier_required no es un dato secreto.
CREATE POLICY documents_public_read_active
  ON public.documents
  FOR SELECT
  USING (is_active = true);

-- 5. Admins pueden leer TODO (incluyendo inactivos) — necesario para
--    el tab Admin > Docs donde se ve la lista completa
CREATE POLICY documents_admin_read_all
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (auth.email() IN (
    'hi@wapnix.com',
    'hi@monkeia.com',
    'contacto@flowback.cl',
    'jimmylavinfeldman@gmail.com'
  ));

-- 6. Admins: INSERT/UPDATE/DELETE total
CREATE POLICY documents_admin_full
  ON public.documents
  FOR ALL
  TO authenticated
  USING (auth.email() IN (
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

-- 7. Estado final (audit AFTER)
SELECT 'AFTER' AS phase, policyname, cmd,
       roles::text       AS roles,
       qual::text        AS using_expr,
       with_check::text  AS check_expr
FROM   pg_policies
WHERE  schemaname = 'public' AND tablename = 'documents'
ORDER  BY policyname;
