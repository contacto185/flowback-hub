-- ─────────────────────────────────────────────────────────────────────────
-- landing_blocks: bloques editables de la sección Clases
-- Unifica "Lo que obtendrás" (section='benefits') y
-- "Recursos destacados" (section='resources').
--
-- Cómo aplicar: pegar este archivo entero en el SQL editor de Supabase
-- (panel del proyecto wvxcqavtjtgvxdvtuvvd) y ejecutar.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.landing_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section      text NOT NULL,                          -- 'benefits' | 'resources' (extensible)
  emoji        text,                                   -- '🏃' (para benefits)
  icon         text,                                   -- lucide icon name, ej 'play-circle' (para resources)
  accent_color text,                                   -- '#EF4444' / 'rgba(...)' — color del icono y de su fondo
  title        text NOT NULL,
  subtitle     text,
  url          text,                                   -- link externo opcional
  order_index  integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_blocks_section_order
  ON public.landing_blocks (section, order_index);

ALTER TABLE public.landing_blocks ENABLE ROW LEVEL SECURITY;

-- Lectura pública de bloques activos (la sección Clases lee de acá)
DROP POLICY IF EXISTS "landing_blocks_public_read_active" ON public.landing_blocks;
CREATE POLICY "landing_blocks_public_read_active"
  ON public.landing_blocks
  FOR SELECT
  USING (is_active = true);

-- Admin: lectura completa (ve también los inactivos en el panel)
DROP POLICY IF EXISTS "landing_blocks_admin_read_all" ON public.landing_blocks;
CREATE POLICY "landing_blocks_admin_read_all"
  ON public.landing_blocks
  FOR SELECT
  USING (auth.email() IN (
    'hi@wapnix.com', 'hi@monkeia.com', 'contacto@flowback.cl', 'jimmylavinfeldman@gmail.com'
  ));

-- Admin: insert/update/delete
DROP POLICY IF EXISTS "landing_blocks_admin_write" ON public.landing_blocks;
CREATE POLICY "landing_blocks_admin_write"
  ON public.landing_blocks
  FOR ALL
  USING (auth.email() IN (
    'hi@wapnix.com', 'hi@monkeia.com', 'contacto@flowback.cl', 'jimmylavinfeldman@gmail.com'
  ))
  WITH CHECK (auth.email() IN (
    'hi@wapnix.com', 'hi@monkeia.com', 'contacto@flowback.cl', 'jimmylavinfeldman@gmail.com'
  ));

-- ─────────────────────────────────────────────────────────────────────────
-- SEED — replica el contenido actualmente hardcoded en index.html
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO public.landing_blocks (section, emoji, title, subtitle, order_index) VALUES
  ('benefits', '🏃', 'Clases en vivo · 7 días a la semana', 'Jimmy o Kira en pantalla, guiándote en tiempo real', 1),
  ('benefits', '📹', '+500 clases grabadas', NULL, 2),
  ('benefits', '🥗', 'Guías de alimentación desinflamatoria', NULL, 3),
  ('benefits', '🧘', 'Meditaciones', NULL, 4),
  ('benefits', '📅', 'Horario de Clases en vivo por Zoom', NULL, 5),
  ('benefits', '💬', 'Guía nutricional y acompañamiento emocional por WhatsApp 24/7', NULL, 6);

INSERT INTO public.landing_blocks (section, icon, accent_color, title, subtitle, url, order_index) VALUES
  ('resources', 'play-circle', '#EF4444', 'Canal de YouTube',
    'Videos gratuitos de bienestar y flow',
    'https://www.youtube.com/@flowback_fitness2293/posts', 1),
  ('resources', 'heart-pulse', '#38BDF8', 'Ebook Rejuvenece y desinflama',
    'Con ejercicios, meditaciones y recetas 🥙',
    'https://drive.google.com/file/d/1KvmQtZ3AKgXupkZyaOGySnw-Phhi9mmb/view', 2);
