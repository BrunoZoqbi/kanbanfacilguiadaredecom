-- Entrada de estoque para consumíveis (produtos com controla_serial = false),
-- que hoje só tinham saída/leitura de saldo, nunca lançamento de entrada.

-- Necessário para o UPSERT abaixo — não havia constraint de unicidade em
-- estoque_saldo até agora (confirmado sem linhas duplicadas em produção).
ALTER TABLE public.estoque_saldo
  ADD CONSTRAINT estoque_saldo_estoque_produto_key UNIQUE (estoque_id, produto_id);

CREATE OR REPLACE FUNCTION public.lancar_entrada_consumivel(
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
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para lançar entrada de estoque';
  END IF;

  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  INSERT INTO public.estoque_saldo (estoque_id, produto_id, quantidade)
  VALUES (p_estoque_id, p_produto_id, p_quantidade)
  ON CONFLICT (estoque_id, produto_id)
  DO UPDATE SET quantidade = estoque_saldo.quantidade + EXCLUDED.quantidade, updated_at = now();

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, estoque_destino_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'entrada_compra', p_estoque_id, p_quantidade, auth.uid(), p_observacao);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.lancar_entrada_consumivel(UUID, UUID, INTEGER, TEXT) TO authenticated;
