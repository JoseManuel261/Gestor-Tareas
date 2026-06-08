-- =====================================================================
-- Fase 4 · Notificaciones en tiempo real + Comentarios / bitácora
-- ---------------------------------------------------------------------
--   1. Tabla comments (bitácora cronológica por tarea).
--   2. Tabla notifications (bandeja por usuario) + realtime.
--   3. Triggers que generan notificaciones automáticamente:
--      • asignación de tarea, • cambio de estado, • nuevo comentario.
--
-- Reutiliza has_project_access de 0002.
-- Ejecutar en: Supabase Dashboard → SQL Editor.  Es idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. COMMENTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id    uuid REFERENCES public.tasks(id)    ON DELETE CASCADE NOT NULL,
  author_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_task_id_idx ON public.comments(task_id, created_at);

-- Helper: acceso a una tarea = acceso a su proyecto (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.has_task_access(_task_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT public.has_project_access(
    (SELECT project_id FROM public.tasks WHERE id = _task_id),
    _user_id
  );
$$;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select ON public.comments;
CREATE POLICY comments_select ON public.comments FOR SELECT
  USING (public.has_task_access(task_id, auth.uid()));

DROP POLICY IF EXISTS comments_insert ON public.comments;
CREATE POLICY comments_insert ON public.comments FOR INSERT
  WITH CHECK (author_id = auth.uid() AND public.has_task_access(task_id, auth.uid()));

DROP POLICY IF EXISTS comments_update ON public.comments;
CREATE POLICY comments_update ON public.comments FOR UPDATE
  USING (author_id = auth.uid());

DROP POLICY IF EXISTS comments_delete ON public.comments;
CREATE POLICY comments_delete ON public.comments FOR DELETE
  USING (author_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2. NOTIFICATIONS
--    Los usuarios solo leen/actualizan/borran las suyas. El INSERT lo
--    hacen exclusivamente los triggers (SECURITY DEFINER) => no hay
--    policy de INSERT para usuarios.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,  -- destinatario
  type       text NOT NULL,                 -- task_assigned | task_status | comment
  title      text NOT NULL,
  body       text,
  link       text,                          -- ruta interna, ej: /projects/<id>
  read       boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete ON public.notifications;
CREATE POLICY notifications_delete ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Realtime: que los INSERT lleguen al cliente suscrito (RLS sigue aplicando).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN
  NULL;  -- ya estaba en la publicación
END $$;

-- ---------------------------------------------------------------------
-- 3. TRIGGERS DE NOTIFICACIÓN (SECURITY DEFINER para saltar RLS de insert)
-- ---------------------------------------------------------------------

-- 3.1 Tareas: asignación nueva y cambios de estado.
CREATE OR REPLACE FUNCTION public.notify_task_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor uuid := auth.uid();
BEGIN
  -- Asignación: en INSERT con asignado, o en UPDATE cuando cambia el asignado.
  IF NEW.assigned_to IS NOT NULL
     AND NEW.assigned_to IS DISTINCT FROM _actor
     AND (TG_OP = 'INSERT' OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.assigned_to, 'task_assigned', 'Nueva tarea asignada',
            NEW.title, '/projects/' || NEW.project_id);
  END IF;

  -- Cambio de estado: notifica al asignado (si no es quien lo cambió).
  IF TG_OP = 'UPDATE'
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.assigned_to IS NOT NULL
     AND NEW.assigned_to IS DISTINCT FROM _actor THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.assigned_to, 'task_status', 'Estado actualizado',
            NEW.title || ' → ' || NEW.status, '/projects/' || NEW.project_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_task_changes ON public.tasks;
CREATE TRIGGER on_task_changes
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_changes();

-- 3.2 Comentarios: avisa al asignado de la tarea y al dueño del proyecto.
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _actor         uuid := auth.uid();
  _title         text;
  _project_id    uuid;
  _assigned_to   uuid;
  _project_owner uuid;
BEGIN
  SELECT t.title, t.project_id, t.assigned_to, p.owner_id
  INTO _title, _project_id, _assigned_to, _project_owner
  FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  WHERE t.id = NEW.task_id;

  -- Al asignado (si existe y no es el autor del comentario).
  IF _assigned_to IS NOT NULL AND _assigned_to IS DISTINCT FROM _actor THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (_assigned_to, 'comment', 'Nuevo comentario', _title, '/projects/' || _project_id);
  END IF;

  -- Al dueño del proyecto (si no es el autor ni el ya notificado asignado).
  IF _project_owner IS DISTINCT FROM _actor
     AND _project_owner IS DISTINCT FROM _assigned_to THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (_project_owner, 'comment', 'Nuevo comentario', _title, '/projects/' || _project_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_comment();
