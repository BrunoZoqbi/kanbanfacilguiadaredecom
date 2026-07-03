-- Defense-in-depth: even if the frontend hasn't force-logged-out a
-- deactivated user yet (or a stale JWT is used directly against the API),
-- the database itself refuses writes from an inactive profile.
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false)
$function$;

-- tasks
DROP POLICY IF EXISTS "Criação de tarefas por papel" ON public.tasks;
CREATE POLICY "Criação de tarefas por papel" ON public.tasks
  FOR INSERT WITH CHECK (
    (created_by_id = auth.uid())
    AND is_user_active()
    AND (
      is_admin()
      OR (assignee_id = auth.uid())
      OR (is_gestor_tecnico() AND (NOT has_role(assignee_id, 'admin'::app_role)))
    )
  );

DROP POLICY IF EXISTS "Atualização de tarefas por papel" ON public.tasks;
CREATE POLICY "Atualização de tarefas por papel" ON public.tasks
  FOR UPDATE USING (
    is_user_active()
    AND (
      is_admin()
      OR (assignee_id = auth.uid())
      OR (is_gestor_tecnico() AND (NOT has_role(assignee_id, 'admin'::app_role)))
    )
  );

-- itens_serializados: split the previous ALL policy so the active-account
-- check applies only to INSERT/UPDATE, leaving SELECT/DELETE untouched.
DROP POLICY IF EXISTS "Admins e gestor técnico gerenciam itens" ON public.itens_serializados;

CREATE POLICY "Admins e gestor tecnico inserem itens" ON public.itens_serializados
  FOR INSERT WITH CHECK ((is_admin() OR is_gestor_tecnico()) AND is_user_active());

CREATE POLICY "Admins e gestor tecnico atualizam itens" ON public.itens_serializados
  FOR UPDATE USING ((is_admin() OR is_gestor_tecnico()) AND is_user_active());

CREATE POLICY "Admins e gestor tecnico deletam itens" ON public.itens_serializados
  FOR DELETE USING (is_admin() OR is_gestor_tecnico());

DROP POLICY IF EXISTS "Tecnicos can update own items" ON public.itens_serializados;
CREATE POLICY "Tecnicos can update own items" ON public.itens_serializados
  FOR UPDATE USING ((tecnico_atual_id = auth.uid()) AND is_user_active());

-- prospeccoes
DROP POLICY IF EXISTS "Cadastro de prospecções por papel" ON public.prospeccoes;
CREATE POLICY "Cadastro de prospecções por papel" ON public.prospeccoes
  FOR INSERT WITH CHECK (
    (is_admin() OR is_gestor_comercial())
    AND is_user_active()
    AND (is_admin() OR (vendedor_responsavel_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Atualização de prospecções por papel" ON public.prospeccoes;
CREATE POLICY "Atualização de prospecções por papel" ON public.prospeccoes
  FOR UPDATE USING (
    is_user_active()
    AND (is_admin() OR (vendedor_responsavel_id = auth.uid()))
  );
