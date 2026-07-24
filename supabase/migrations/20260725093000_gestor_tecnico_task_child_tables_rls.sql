-- Auditoria de permissões do Gestor Técnico em tabelas filhas de tasks.
-- A RLS de `tasks` já inclui is_gestor_tecnico() (SELECT/INSERT/UPDATE,
-- excluindo tarefas de admin via NOT has_role(assignee_id,'admin')), mas
-- as tabelas filhas (checklist, anexos, tags, comentários) nunca
-- herdaram essa regra — mesmo padrão de lacuna já registrado em
-- CLAUDE.md ("Policies RLS de tabelas filhas não herdam automaticamente
-- correções feitas na tabela pai").
--
-- task_types NÃO foi alterada: é catálogo global (como categorias_produto,
-- scripts_atendimento), não dado de uma tarefa específica da equipe —
-- mantém-se admin-only na escrita, com leitura já liberada a todos.

-- ============================================================
-- task_checklist_items
-- ============================================================
-- SELECT também não tinha is_gestor_tecnico() (lacuna extra, além do que
-- foi pedido para UPDATE/DELETE/INSERT): um Gestor Técnico conseguia ver
-- a tarefa da equipe mas não o checklist dela.
DROP POLICY IF EXISTS "Users can view checklists on accessible tasks" ON public.task_checklist_items;
CREATE POLICY "Users can view checklists on accessible tasks" ON public.task_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR tasks.created_by_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can insert checklist items on own tasks" ON public.task_checklist_items;
CREATE POLICY "Users can insert checklist items on own tasks" ON public.task_checklist_items
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can update checklist items on own tasks" ON public.task_checklist_items;
CREATE POLICY "Users can update checklist items on own tasks" ON public.task_checklist_items
  FOR UPDATE USING (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete checklist items on own tasks" ON public.task_checklist_items;
CREATE POLICY "Users can delete checklist items on own tasks" ON public.task_checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_checklist_items.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

-- ============================================================
-- task_attachments
-- ============================================================
-- UPDATE também não tinha is_gestor_tecnico() (não pedido explicitamente,
-- mas deixado inconsistente com SELECT/INSERT/DELETE seria o mesmo tipo
-- de lacuna de novo).
DROP POLICY IF EXISTS "Users can view attachments on accessible tasks" ON public.task_attachments;
CREATE POLICY "Users can view attachments on accessible tasks" ON public.task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR tasks.created_by_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can insert attachments on own tasks" ON public.task_attachments;
CREATE POLICY "Users can insert attachments on own tasks" ON public.task_attachments
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can update attachments on own tasks" ON public.task_attachments;
CREATE POLICY "Users can update attachments on own tasks" ON public.task_attachments
  FOR UPDATE USING (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can delete attachments on own tasks" ON public.task_attachments;
CREATE POLICY "Users can delete attachments on own tasks" ON public.task_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_attachments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

-- ============================================================
-- task_tags (policy única FOR ALL cobre INSERT/UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage task tags for accessible tasks" ON public.task_tags;
CREATE POLICY "Users can manage task tags for accessible tasks" ON public.task_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_tags.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

-- ============================================================
-- task_comments (não tem UPDATE/DELETE hoje — comentários são
-- append-only por design, fora do escopo desta correção)
-- ============================================================
DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can view comments on accessible tasks" ON public.task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR tasks.created_by_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );

DROP POLICY IF EXISTS "Users can create comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can create comments on accessible tasks" ON public.task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND is_user_active() AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
        AND (
          tasks.assignee_id = auth.uid()
          OR tasks.created_by_id = auth.uid()
          OR is_admin()
          OR (is_gestor_tecnico() AND NOT has_role(tasks.assignee_id, 'admin'::app_role))
        )
    )
  );
