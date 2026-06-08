-- =====================================================================
-- Fase 1 · Endurecimiento del trigger de creación de perfiles para OAuth
-- ---------------------------------------------------------------------
-- Problema que resuelve:
--   • El trigger original usa split_part(email,'@',1) como username y solo
--     maneja ON CONFLICT (id). Si dos cuentas derivan el mismo username, el
--     UNIQUE(username) lanza una excepción DENTRO del trigger SECURITY DEFINER
--     y aborta el INSERT en auth.users => el signup/OAuth falla con un 500.
--   • Los proveedores OAuth (GitHub/Google) NO envían 'username' en metadata.
--
-- Solución:
--   • Deriva el username de múltiples fuentes (form, GitHub 'user_name', email).
--   • Garantiza unicidad agregando un sufijo numérico si ya existe.
--   • Captura avatar_url y full_name desde la metadata del proveedor.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor.  Es idempotente.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username text;
  final_username text;
  suffix int := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(new.raw_user_meta_data->>'username', ''),
    NULLIF(new.raw_user_meta_data->>'user_name', ''),  -- GitHub
    NULLIF(split_part(new.email, '@', 1), ''),
    'user'
  );

  final_username := base_username;

  -- Garantiza unicidad sin romper el INSERT.
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    final_username,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',      -- Google / GitHub
      ''
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'    -- Google
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- El trigger on_auth_user_created ya existe y sigue apuntando a esta función.
