-- Admin / gestor técnico: repair completed, item goes back to the general
-- stock as 'disponivel'.
CREATE OR REPLACE FUNCTION public.reparo_concluido(
  p_item_id UUID,
  p_observacao TEXT DEFAULT NULL::text
)
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

-- Admin / gestor técnico: no repair possible, confirm permanent write-off.
CREATE OR REPLACE FUNCTION public.confirmar_baixa_definitiva(
  p_item_id UUID,
  p_observacao TEXT DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
BEGIN
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
