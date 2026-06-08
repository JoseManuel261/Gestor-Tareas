-- =====================================================================
-- Fase 3 (Parte 1 · solo BD) · Invitaciones por enlace único + RBAC base
-- ---------------------------------------------------------------------
-- Contenido:
--   1. Tabla public.invitations (enlace reutilizable, caducidad 7 días).
--   2. RLS: solo el owner del grupo gestiona los enlaces.
--   3. RPC accept_invitation(token): aceptación atómica del lado servidor.
--   4. Endurecimiento de gm_insert (cierra el hueco de autoinserción).
--
-- Reutiliza is_group_owner / is_group_member de la migración 0002.
-- Ejecutar en: Supabase Dashboard → SQL Editor.  Es idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLA invitations
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token       uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,    -- va en la URL /invite/[token]
  group_id    uuid REFERENCES public.groups(id)   ON DELETE CASCADE NOT NULL,
  invited_by  uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role        text CHECK (role IN ('admin', 'member')) DEFAULT 'member' NOT NULL,
  email       text,                                              -- NULL = enlace abierto
  max_uses    int,                                               -- NULL = reutilizable (ilimitado)
  uses        int  DEFAULT 0 NOT NULL,
  expires_at  timestamptz DEFAULT (now() + interval '7 days'),   -- caducidad por defecto
  revoked_at  timestamptz,                                       -- NULL = activa
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS invitations_group_id_idx ON public.invitations(group_id);

-- ---------------------------------------------------------------------
-- 2. RLS: solo el owner del grupo ve/crea/edita/borra invitaciones.
--    (El invitado NO necesita SELECT: la aceptación pasa por la RPC.)
-- ---------------------------------------------------------------------
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations FOR SELECT
  USING (public.is_group_owner(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid() AND public.is_group_owner(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations FOR UPDATE
  USING (public.is_group_owner(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations FOR DELETE
  USING (public.is_group_owner(group_id, auth.uid()));

-- ---------------------------------------------------------------------
-- 3. RPC accept_invitation: valida y une al usuario atómicamente.
--    SECURITY DEFINER => puede insertar en group_members aunque la
--    policy gm_insert sea owner-only. auth.uid() sigue siendo el
--    usuario que llama (se lee del JWT, no del definer).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation(_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _uid        uuid := auth.uid();
  _inv        public.invitations%ROWTYPE;
  _user_email text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING errcode = '28000';
  END IF;

  SELECT * INTO _inv FROM public.invitations WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada';
  END IF;

  IF _inv.revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'La invitación fue revocada';
  END IF;

  IF _inv.expires_at IS NOT NULL AND _inv.expires_at <= now() THEN
    RAISE EXCEPTION 'La invitación ha caducado';
  END IF;

  IF _inv.max_uses IS NOT NULL AND _inv.uses >= _inv.max_uses THEN
    RAISE EXCEPTION 'La invitación alcanzó su límite de usos';
  END IF;

  -- Si el enlace está dirigido a un correo concreto, validarlo.
  IF _inv.email IS NOT NULL THEN
    SELECT email INTO _user_email FROM auth.users WHERE id = _uid;
    IF lower(_user_email) IS DISTINCT FROM lower(_inv.email) THEN
      RAISE EXCEPTION 'Esta invitación está dirigida a otro correo';
    END IF;
  END IF;

  -- Idempotente: si ya es miembro, no duplicamos ni consumimos un uso.
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _inv.group_id AND user_id = _uid
  ) THEN
    RETURN _inv.group_id;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (_inv.group_id, _uid, _inv.role);

  UPDATE public.invitations SET uses = uses + 1 WHERE id = _inv.id;

  RETURN _inv.group_id;
END;
$$;

-- La RPC se invoca desde el cliente autenticado vía PostgREST.
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 4. Endurecer gm_insert: SOLO el owner inserta miembros directamente.
--    Elimina el branch user_id = auth.uid() que permitía autoinserción
--    en cualquier grupo. El flujo de crear-grupo no se rompe (al añadirse
--    el owner ya es dueño). La aceptación de enlaces va por la RPC.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS gm_insert ON public.group_members;
CREATE POLICY gm_insert ON public.group_members FOR INSERT
  WITH CHECK (public.is_group_owner(group_id, auth.uid()));

-- =====================================================================
-- VERIFICACIÓN MANUAL (opcional, ejecutar como pruebas sueltas):
--   -- 1. Como owner del grupo G, crear un enlace:
--   --    insert into public.invitations (group_id, invited_by)
--   --    values ('<G>', auth.uid()) returning token;
--   -- 2. Como OTRO usuario autenticado, aceptar:
--   --    select public.accept_invitation('<token>');   -- devuelve group_id
--   -- 3. Reintentar con el mismo usuario => idempotente (no duplica, uses no sube).
--   -- 4. Intentar autoinsertarse saltando la RPC debe FALLAR:
--   --    insert into public.group_members (group_id, user_id) values ('<G>', auth.uid());
-- =====================================================================
