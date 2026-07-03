-- FIX 1: propagate is_user_active() into the role-check helper functions
-- so every RLS policy that depends on is_admin()/is_gestor_tecnico()/
-- is_gestor_comercial() automatically stops trusting a deactivated
-- account, even if it technically still holds the role.
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin') AND public.is_user_active()
$function$;

CREATE OR REPLACE FUNCTION public.is_gestor_tecnico()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'gestor_tecnico') AND public.is_user_active()
$function$;

CREATE OR REPLACE FUNCTION public.is_gestor_comercial()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'gestor_comercial') AND public.is_user_active()
$function$;

-- FIX 2: movimentacoes_estoque must only be written through the RPC
-- functions (SECURITY DEFINER, bypass RLS, already validated). Direct
-- INSERT from a regular authenticated client is now admin-only, for
-- exceptional manual corrections. No frontend code performs a direct
-- insert into this table today (confirmed via grep).
DROP POLICY IF EXISTS "Authenticated users can create movimentacoes" ON public.movimentacoes_estoque;
CREATE POLICY "Apenas admin insere movimentacoes diretamente" ON public.movimentacoes_estoque
  FOR INSERT WITH CHECK (is_admin());

-- FIX 3: require an active account on INSERT/UPDATE for the task/prospecção
-- child tables, same pattern already applied to tasks/itens_serializados/
-- prospeccoes.

-- task_attachments: split the ALL policy so is_user_active() only gates
-- INSERT/UPDATE, leaving SELECT/DELETE untouched.
DROP POLICY IF EXISTS "Users can manage attachments on own tasks" ON public.task_attachments;

CREATE POLICY "Users can insert attachments on own tasks" ON public.task_attachments
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can update attachments on own tasks" ON public.task_attachments
  FOR UPDATE USING (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can delete attachments on own tasks" ON public.task_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

-- task_checklist_items: same split.
DROP POLICY IF EXISTS "Users can manage checklists on own tasks" ON public.task_checklist_items;

CREATE POLICY "Users can insert checklist items on own tasks" ON public.task_checklist_items
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can update checklist items on own tasks" ON public.task_checklist_items
  FOR UPDATE USING (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can delete checklist items on own tasks" ON public.task_checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (tasks.assignee_id = auth.uid() OR is_admin())
    )
  );

-- task_comments: only has an INSERT policy today (no UPDATE/DELETE) — add
-- the check there.
DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can create comments on accessible tasks" ON public.task_comments
  FOR INSERT WITH CHECK (
    (user_id = auth.uid())
    AND is_user_active()
    AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
        AND (tasks.assignee_id = auth.uid() OR tasks.created_by_id = auth.uid() OR is_admin())
    )
  );

-- prospeccoes_respostas: split the ALL policy so is_user_active() only
-- gates INSERT/UPDATE.
DROP POLICY IF EXISTS "Gerenciar respostas de prospecções próprias" ON public.prospeccoes_respostas;

CREATE POLICY "Inserir respostas de prospecções próprias" ON public.prospeccoes_respostas
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.prospeccoes p
      WHERE p.id = prospeccoes_respostas.prospeccao_id
        AND (is_admin() OR p.vendedor_responsavel_id = auth.uid())
    )
  );

CREATE POLICY "Atualizar respostas de prospecções próprias" ON public.prospeccoes_respostas
  FOR UPDATE USING (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.prospeccoes p
      WHERE p.id = prospeccoes_respostas.prospeccao_id
        AND (is_admin() OR p.vendedor_responsavel_id = auth.uid())
    )
  );

CREATE POLICY "Deletar respostas de prospecções próprias" ON public.prospeccoes_respostas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.prospeccoes p
      WHERE p.id = prospeccoes_respostas.prospeccao_id
        AND (is_admin() OR p.vendedor_responsavel_id = auth.uid())
    )
  );
