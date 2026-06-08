-- =====================================================================
-- Fase 1 · RLS por pertenencia (cierra la fuga de datos USING(true))
-- ---------------------------------------------------------------------
-- Antes: profiles/groups/group_members/projects/tasks tenían políticas
-- USING(true) / WITH CHECK(true) => cualquiera con la anon key leía y
-- modificaba TODOS los datos de todos los usuarios.
--
-- Esta migración reescribe las políticas para que el acceso dependa de
-- pertenencia real (owner_id o membresía vía group_members).
--
-- Funciones SECURITY DEFINER auxiliares: evitan la recursión infinita de
-- RLS (una policy de group_members que consulte group_members) porque la
-- función se ejecuta con privilegios del owner y NO re-evalúa RLS.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor.  Es idempotente.
-- Nota: profiles.SELECT se mantiene abierto a propósito (lo necesita la
-- invitación por username y el listado de miembros). Solo expone
-- username/full_name/avatar. Se cerrará en Fase 3 con invitación por token.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Funciones auxiliares (bypassean RLS => sin recursión)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
      AND (
        p.owner_id = _user_id
        OR (p.group_id IS NOT NULL AND public.is_group_member(p.group_id, _user_id))
      )
  );
$$;

-- ---------------------------------------------------------------------
-- 2. GROUPS: visible para owner o miembro; escribir solo el owner
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS groups_select ON public.groups;
CREATE POLICY groups_select ON public.groups FOR SELECT
  USING (owner_id = auth.uid() OR public.is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS groups_insert ON public.groups;
CREATE POLICY groups_insert ON public.groups FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS groups_update ON public.groups;
CREATE POLICY groups_update ON public.groups FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS groups_delete ON public.groups;
CREATE POLICY groups_delete ON public.groups FOR DELETE
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. GROUP_MEMBERS: ver co-miembros del grupo; insertar/borrar el owner
--    (o uno mismo, para unirse / salir). Corrige el bug que impedía al
--    owner expulsar miembros.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS gm_select ON public.group_members;
CREATE POLICY gm_select ON public.group_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS gm_insert ON public.group_members;
CREATE POLICY gm_insert ON public.group_members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_group_owner(group_id, auth.uid()));

DROP POLICY IF EXISTS gm_delete ON public.group_members;
CREATE POLICY gm_delete ON public.group_members FOR DELETE
  USING (user_id = auth.uid() OR public.is_group_owner(group_id, auth.uid()));

-- ---------------------------------------------------------------------
-- 4. PROJECTS: visible para owner o miembro del grupo; insertar en grupo
--    exige ser miembro; editar/borrar solo el owner del proyecto
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
  );

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert ON public.projects FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (group_id IS NULL OR public.is_group_member(group_id, auth.uid()))
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update ON public.projects FOR UPDATE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS projects_delete ON public.projects;
CREATE POLICY projects_delete ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. TASKS: acceso atado al proyecto padre (owner o miembro del grupo),
--    o si la tarea está asignada al usuario
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT
  USING (public.has_project_access(project_id, auth.uid()) OR assigned_to = auth.uid());

DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks FOR INSERT
  WITH CHECK (public.has_project_access(project_id, auth.uid()));

DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks FOR UPDATE
  USING (public.has_project_access(project_id, auth.uid()));

DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks FOR DELETE
  USING (public.has_project_access(project_id, auth.uid()));
