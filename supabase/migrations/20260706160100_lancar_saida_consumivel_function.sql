-- Par que faltava de lancar_entrada_consumivel: baixa de estoque de
-- consumíveis por uso/consumo (ex: cabo usado numa instalação, sem
-- passar pelo fluxo de retirada de item serializado).
CREATE OR REPLACE FUNCTION public.lancar_saida_consumivel(
  p_produto_id UUID,
  p_estoque_id UUID,
  p_quantidade INTEGER,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_saldo_atual INTEGER;
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para lançar saída de estoque';
  END IF;

  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  -- Trava a linha para evitar corrida entre duas saídas concorrentes
  -- deixando o saldo negativo.
  SELECT quantidade INTO v_saldo_atual
  FROM public.estoque_saldo
  WHERE estoque_id = p_estoque_id AND produto_id = p_produto_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL OR v_saldo_atual < p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente: disponível %, solicitado %', COALESCE(v_saldo_atual, 0), p_quantidade;
  END IF;

  UPDATE public.estoque_saldo
  SET quantidade = quantidade - p_quantidade, updated_at = now()
  WHERE estoque_id = p_estoque_id AND produto_id = p_produto_id;

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, estoque_origem_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'saida_consumo', p_estoque_id, p_quantidade, auth.uid(), p_observacao);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.lancar_saida_consumivel(UUID, UUID, INTEGER, TEXT) TO authenticated;
