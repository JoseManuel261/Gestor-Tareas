-- =====================================================================
-- Fase 3 (Parte 2) · RBAC real por rol (owner / admin / member)
-- ---------------------------------------------------------------------
-- Matriz aplicada:
--   • admin: gestiona invitaciones, expulsa members, gestiona proyectos.
--   • member: solo ve y trabaja tareas (ya NO crea proyectos).
--   • owner: todo + cambiar roles + editar/eliminar el grupo.
--
-- Reutiliza is_group_owner / is_group_member de 0002.
-- Ejecutar en: Supabase Dashboard → SQL Editor.  Es idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helper: ¿es owner o admin del grupo? (SECURITY DEFINER, sin recursión)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE id = _group_id AND owner_id = _user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = _group_id AND user_id = _user_id AND role IN ('owner', 'admin')
    );
$$;

-- ---------------------------------------------------------------------
-- 2. INVITATIONS: pasan de owner-only a admin (owner o admin)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS invitations_select ON public.invitations;
CREATE POLICY invitations_select ON public.invitations FOR SELECT
  USING (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_insert ON public.invitations;
CREATE POLICY invitations_insert ON public.invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid() AND public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_update ON public.invitations;
CREATE POLICY invitations_update ON public.invitations FOR UPDATE
  USING (public.is_group_admin(group_id, auth.uid()));

DROP POLICY IF EXISTS invitations_delete ON public.invitations;
CREATE POLICY invitations_delete ON public.invitations FOR DELETE
  USING (public.is_group_admin(group_id, auth.uid()));

-- ---------------------------------------------------------------------
-- 3. GROUP_MEMBERS
--    DELETE: salir uno mismo | owner expulsa a cualquiera | admin solo a members
--    UPDATE (nuevo): solo el owner cambia roles, nunca el suyo, solo a admin/member
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS gm_delete ON public.group_members;
CREATE POLICY gm_delete ON public.group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_group_owner(group_id, auth.uid())
    OR (public.is_group_admin(group_id, auth.uid()) AND role = 'member')
  );

DROP POLICY IF EXISTS gm_update ON public.group_members;
CREATE POLICY gm_update ON public.group_members FOR UPDATE
  USING (
    public.is_group_owner(group_id, auth.uid())
    AND NOT public.is_group_owner(group_id, user_id)   -- no se toca la fila del owner
  )
  WITH CHECK (
    public.is_group_owner(group_id, auth.uid())
    AND role IN ('admin', 'member')                    -- no se crea un segundo 'owner'
  );

-- ---------------------------------------------------------------------
-- 4. PROJECTS: crear/editar/borrar proyectos de grupo => admin (owner o admin)
--    Los proyectos personales (group_id NULL) siguen siendo del dueño.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (group_id IS NULL OR public.is_group_admin(group_id, auth.uid()))
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid()))
  );

DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects FOR DELETE
  USING (
    owner_id = auth.uid()
    OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid()))
  );

-- NOTA: tasks sigue con has_project_access => todos los miembros trabajan tareas.
