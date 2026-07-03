-- has_role() was callable by ANYONE (including anon) to check whether ANY
-- arbitrary user_id holds ANY role — an information disclosure. Restrict it
-- to: the caller checking their own role, OR admin, OR gestor_tecnico.
--
-- gestor_tecnico is included (not just admin) because it already relies on
-- has_role(other_user_id, 'admin') for a real security purpose: the tasks
-- RLS policies use it to hide tasks assigned to admins from gestor
-- técnico's visibility, and CreateTaskForm.tsx uses it client-side to
-- filter admins out of the assignee dropdown. Restricting to self-or-admin
-- only would have silently broken that existing behavior. Note this
-- function is not itself recursive with is_admin()/is_gestor_tecnico() —
-- the admin/gestor_tecnico check here is inlined directly against
-- user_roles to avoid any circular dependency.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
  AND (
    auth.uid() = _user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor_tecnico')
    )
  )
$function$;
