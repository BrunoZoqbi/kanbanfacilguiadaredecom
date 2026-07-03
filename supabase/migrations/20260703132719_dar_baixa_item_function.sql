-- Admin / gestor técnico: gives a serialized item a defect/write-off status
-- (analise_defeito or baixado). Only items currently 'disponivel' or
-- 'com_tecnico' can be flagged — an installed item must be recolhido first.
CREATE OR REPLACE FUNCTION public.dar_baixa_item(
  p_item_id UUID,
  p_novo_status public.status_item,
  p_observacao TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_produto_id UUID;
  v_tipo_mov public.tipo_movimento_estoque;
BEGIN
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
