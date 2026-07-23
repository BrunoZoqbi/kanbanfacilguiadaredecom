-- Notifica admin/gestor_tecnico quando uma saída de consumível deixa o
-- saldo em ou abaixo do limite de "estoque baixo" configurado
-- (system_configs.estoque_baixo_limite — mesmo limite usado no badge de
-- EstoqueDisponivel.tsx).
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
  v_saldo_novo INTEGER;
  v_limite_estoque_baixo INTEGER;
  v_produto_nome TEXT;
  v_destinatario RECORD;
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

  v_saldo_novo := v_saldo_atual - p_quantidade;

  UPDATE public.estoque_saldo
  SET quantidade = v_saldo_novo, updated_at = now()
  WHERE estoque_id = p_estoque_id AND produto_id = p_produto_id;

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, estoque_origem_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'saida_consumo', p_estoque_id, p_quantidade, auth.uid(), p_observacao);

  SELECT value::INTEGER INTO v_limite_estoque_baixo
  FROM public.system_configs
  WHERE key = 'estoque_baixo_limite';

  IF v_limite_estoque_baixo IS NOT NULL AND v_saldo_novo <= v_limite_estoque_baixo THEN
    SELECT nome INTO v_produto_nome FROM public.produtos WHERE id = p_produto_id;

    FOR v_destinatario IN
      SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin', 'gestor_tecnico')
    LOOP
      PERFORM public.criar_notificacao(
        v_destinatario.user_id,
        'estoque_baixo',
        'Estoque baixo',
        v_produto_nome || ' — saldo: ' || v_saldo_novo,
        '/estoque'
      );
    END LOOP;
  END IF;
END;
$function$;
