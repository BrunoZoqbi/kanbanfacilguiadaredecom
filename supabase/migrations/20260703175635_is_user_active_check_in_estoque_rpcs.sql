-- Defense-in-depth: these SECURITY DEFINER functions bypass RLS entirely,
-- so the is_user_active() policy check added to tasks/itens_serializados/
-- prospeccoes doesn't reach them. Add the same guard as the first check in
-- every one of them.

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
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

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
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

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

CREATE OR REPLACE FUNCTION public.instalar_item(p_item_id uuid, p_cliente_vinculado text, p_os_vinculada text, p_local_instalacao text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
BEGIN
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

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
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

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

CREATE OR REPLACE FUNCTION public.dar_baixa_item(p_item_id uuid, p_novo_status status_item, p_observacao text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_tipo_mov public.tipo_movimento_estoque;
BEGIN
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para dar baixa neste item';
  END IF;

  IF p_novo_status NOT IN ('analise_defeito', 'baixado') THEN
    RAISE EXCEPTION 'Status inválido: use analise_defeito ou baixado';
  END IF;

  IF p_observacao IS NULL OR trim(p_observacao) = '' THEN
    RAISE EXCEPTION 'Observação é obrigatória';
  END IF;

  SELECT produto_id INTO v_produto_id FROM public.itens_serializados
  WHERE id = p_item_id AND status IN ('disponivel', 'com_tecnico');
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado, ou não está disponível/com técnico (recolha o item antes de dar baixa)';
  END IF;

  v_tipo_mov := CASE WHEN p_novo_status = 'analise_defeito' THEN 'baixa_defeito' ELSE 'descarte' END;

  UPDATE public.itens_serializados
  SET status = p_novo_status,
      estoque_atual_id = NULL,
      tecnico_atual_id = NULL,
      ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, v_tipo_mov, auth.uid(), p_observacao);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reparo_concluido(p_item_id uuid, p_observacao text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_estoque_geral_id UUID;
BEGIN
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para concluir reparo deste item';
  END IF;

  SELECT produto_id INTO v_produto_id FROM public.itens_serializados
  WHERE id = p_item_id AND status = 'analise_defeito';
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está em análise de defeito';
  END IF;

  SELECT id INTO v_estoque_geral_id FROM public.estoques WHERE tipo = 'geral' LIMIT 1;

  UPDATE public.itens_serializados
  SET status = 'disponivel',
      estoque_atual_id = v_estoque_geral_id,
      tecnico_atual_id = NULL,
      ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, estoque_destino_id, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, 'devolucao_sede', v_estoque_geral_id, auth.uid(), p_observacao);
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_baixa_definitiva(p_item_id uuid, p_observacao text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
BEGIN
  IF NOT is_user_active() THEN
    RAISE EXCEPTION 'Usuário desativado não pode executar esta ação';
  END IF;

  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para confirmar a baixa deste item';
  END IF;

  SELECT produto_id INTO v_produto_id FROM public.itens_serializados
  WHERE id = p_item_id AND status = 'analise_defeito';
  IF v_produto_id IS NULL THEN
    RAISE EXCEPTION 'Item não encontrado ou não está em análise de defeito';
  END IF;

  UPDATE public.itens_serializados
  SET status = 'baixado',
      ultima_movimentacao_em = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.movimentacoes_estoque (produto_id, item_serializado_id, tipo_movimento, usuario_responsavel_id, observacao)
  VALUES (v_produto_id, p_item_id, 'descarte', auth.uid(), p_observacao);
END;
$function$;
