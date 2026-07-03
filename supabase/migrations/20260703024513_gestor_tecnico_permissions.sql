-- Gestor Técnico permissions: role-check helper, stock-movement RPCs
-- (retirada/instalação/devolução/recolhimento), the task<->item link used by
-- "lançar recolhimento", and role-aware RLS on itens_serializados/tasks.

CREATE OR REPLACE FUNCTION public.is_gestor_tecnico()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'gestor_tecnico')
$function$;

-- Link a Kanban task to the serialized item it was opened to recolher.
ALTER TABLE public.tasks ADD COLUMN item_serializado_id UUID REFERENCES public.itens_serializados(id);

-- Admin / gestor técnico: move an available item into a technician's custody.
CREATE OR REPLACE FUNCTION public.retirar_para_tecnico(p_item_id uuid, p_tecnico_id uuid, p_observacao text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_estoque_geral_id UUID;
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para retirar item para técnico';
  END IF;

  SELECT produto_id INTO v_produto_id FROM public.itens_serializados WHERE id = p_item_id AND status = 'disponivel';
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está disponível';
  END IF;

  SELECT id INTO v_estoque_geral_id FROM public.estoques WHERE tipo = 'geral' LIMIT 1;

  UPDATE public.itens_serializados
  SET status = 'com_tecnico', tecnico_atual_id = p_tecnico_id, estoque_atual_id = NULL, ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, estoque_origem_id, tecnico_id, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, 'retirada_tecnico', v_estoque_geral_id, p_tecnico_id, auth.uid(), p_observacao);
END;
$function$;

-- Técnico self-service: install an item they currently hold at a client.
CREATE OR REPLACE FUNCTION public.instalar_item(p_item_id uuid, p_cliente_vinculado text, p_os_vinculada text, p_local_instalacao text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
BEGIN
  SELECT produto_id INTO v_produto_id FROM public.itens_serializados
  WHERE id = p_item_id AND status = 'com_tecnico' AND tecnico_atual_id = auth.uid();
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está sob sua posse';
  END IF;

  UPDATE public.itens_serializados
  SET status = 'instalado_cliente', tecnico_atual_id = NULL,
      cliente_vinculado = p_cliente_vinculado, os_vinculada = p_os_vinculada, local_instalacao = p_local_instalacao,
      ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, tecnico_id, cliente_vinculado, os_vinculada, usuario_responsavel_id)
  VALUES (v_produto_id, p_item_id, 'instalacao', auth.uid(), p_cliente_vinculado, p_os_vinculada, auth.uid());
END;
$function$;

-- Técnico self-service: return an item they currently hold back to the sede.
CREATE OR REPLACE FUNCTION public.devolver_sede(p_item_id uuid, p_observacao text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_estoque_geral_id UUID;
BEGIN
  SELECT produto_id INTO v_produto_id FROM public.itens_serializados
  WHERE id = p_item_id AND status = 'com_tecnico' AND tecnico_atual_id = auth.uid();
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está sob sua posse';
  END IF;

  SELECT id INTO v_estoque_geral_id FROM public.estoques WHERE tipo = 'geral' LIMIT 1;

  UPDATE public.itens_serializados
  SET status = 'disponivel', tecnico_atual_id = NULL, estoque_atual_id = v_estoque_geral_id, ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, estoque_destino_id, tecnico_id, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, 'devolucao_sede', v_estoque_geral_id, auth.uid(), auth.uid(), p_observacao);
END;
$function$;

-- Admin / gestor técnico: create the Kanban recolhimento task AND move the
-- item back into the assigned technician's custody in a single call.
CREATE OR REPLACE FUNCTION public.lancar_tarefa_recolhimento(p_item_id uuid, p_tecnico_id uuid, p_titulo text, p_descricao text, p_due_date timestamp with time zone, p_location text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_task_id UUID;
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para lançar recolhimento';
  END IF;

  SELECT produto_id INTO v_produto_id FROM public.itens_serializados WHERE id = p_item_id AND status = 'instalado_cliente';
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está instalado em cliente';
  END IF;

  INSERT INTO public.tasks (title, description, assignee_id, created_by_id, due_date, location, item_serializado_id, priority)
  VALUES (p_titulo, p_descricao, p_tecnico_id, auth.uid(), p_due_date, p_location, p_item_id, 'medium')
  RETURNING id INTO v_task_id;

  UPDATE public.itens_serializados
  SET status = 'com_tecnico', tecnico_atual_id = p_tecnico_id, estoque_atual_id = NULL,
      cliente_vinculado = NULL, os_vinculada = NULL, local_instalacao = NULL, ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, tecnico_id, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, 'recolhimento', p_tecnico_id, auth.uid(), 'Recolhimento vinculado à tarefa: ' || v_task_id);

  RETURN v_task_id;
END;
$function$;

-- itens_serializados: gestor técnico gets the same management rights as admin
-- (the RPCs above still gate who can actually call each action).
DROP POLICY IF EXISTS "Admins can manage all itens" ON public.itens_serializados;
CREATE POLICY "Admins e gestor técnico gerenciam itens" ON public.itens_serializados
  FOR ALL USING (is_admin() OR is_gestor_tecnico());

-- tasks: role-aware visibility/creation/update. Regular users are limited to
-- their own tasks; gestor técnico can see/create/update tasks for anyone who
-- isn't an admin (mirrors the assignee filtering done in CreateTaskForm).
DROP POLICY IF EXISTS "Users can view own tasks or admins see all" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks or admins update all" ON public.tasks;

CREATE POLICY "Visibilidade de tarefas por papel" ON public.tasks
  FOR SELECT USING (
    is_admin()
    OR assignee_id = auth.uid()
    OR created_by_id = auth.uid()
    OR (is_gestor_tecnico() AND NOT has_role(assignee_id, 'admin'::app_role))
  );

CREATE POLICY "Criação de tarefas por papel" ON public.tasks
  FOR INSERT WITH CHECK (
    created_by_id = auth.uid()
    AND (
      is_admin()
      OR assignee_id = auth.uid()
      OR (is_gestor_tecnico() AND NOT has_role(assignee_id, 'admin'::app_role))
    )
  );

CREATE POLICY "Atualização de tarefas por papel" ON public.tasks
  FOR UPDATE USING (
    is_admin()
    OR assignee_id = auth.uid()
    OR (is_gestor_tecnico() AND NOT has_role(assignee_id, 'admin'::app_role))
  );
