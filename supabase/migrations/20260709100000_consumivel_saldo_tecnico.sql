-- Corrige a arquitetura de consumíveis para espelhar o fluxo já existente de
-- item serializado (Retirar para Técnico -> Uso -> Devolver à Sede), em vez
-- do modelo anterior de saída direta da sede (lancar_saida_consumivel
-- continua existindo, mas passa a ser só para baixa/perda/descarte sem
-- passar por técnico).

CREATE TABLE public.consumivel_saldo_tecnico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade NUMERIC NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumivel_saldo_tecnico_tecnico_produto_key UNIQUE (tecnico_id, produto_id)
);

ALTER TABLE public.consumivel_saldo_tecnico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tecnico gerencia proprio saldo de consumivel" ON public.consumivel_saldo_tecnico
  FOR ALL USING (tecnico_id = auth.uid());

CREATE POLICY "Admin e gestor tecnico gerenciam todo saldo de consumivel" ON public.consumivel_saldo_tecnico
  FOR ALL USING (is_admin() OR is_gestor_tecnico());

-- Admin / gestor técnico: retira consumível da sede para o saldo do técnico.
CREATE OR REPLACE FUNCTION public.retirar_consumivel_para_tecnico(
  p_produto_id UUID,
  p_tecnico_id UUID,
  p_quantidade NUMERIC,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_estoque_geral_id UUID;
  v_saldo_atual NUMERIC;
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para retirar consumível para técnico';
  END IF;

  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  SELECT id INTO v_estoque_geral_id FROM public.estoques WHERE tipo = 'geral' LIMIT 1;

  -- Trava a linha para evitar corrida entre duas retiradas concorrentes
  -- deixando o saldo da sede negativo.
  SELECT quantidade INTO v_saldo_atual
  FROM public.estoque_saldo
  WHERE estoque_id = v_estoque_geral_id AND produto_id = p_produto_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL OR v_saldo_atual < p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente na sede: disponível %, solicitado %', COALESCE(v_saldo_atual, 0), p_quantidade;
  END IF;

  UPDATE public.estoque_saldo
  SET quantidade = quantidade - p_quantidade, updated_at = now()
  WHERE estoque_id = v_estoque_geral_id AND produto_id = p_produto_id;

  INSERT INTO public.consumivel_saldo_tecnico (tecnico_id, produto_id, quantidade)
  VALUES (p_tecnico_id, p_produto_id, p_quantidade)
  ON CONFLICT (tecnico_id, produto_id)
  DO UPDATE SET quantidade = consumivel_saldo_tecnico.quantidade + EXCLUDED.quantidade, updated_at = now();

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, estoque_origem_id, tecnico_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'retirada_tecnico', v_estoque_geral_id, p_tecnico_id, p_quantidade, auth.uid(), p_observacao);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.retirar_consumivel_para_tecnico(UUID, UUID, NUMERIC, TEXT) TO authenticated;

-- Técnico self-service: consome/usa consumível do próprio saldo em campo.
CREATE OR REPLACE FUNCTION public.lancar_uso_consumivel(
  p_produto_id UUID,
  p_quantidade NUMERIC,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_saldo_atual NUMERIC;
BEGIN
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  SELECT quantidade INTO v_saldo_atual
  FROM public.consumivel_saldo_tecnico
  WHERE tecnico_id = auth.uid() AND produto_id = p_produto_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL OR v_saldo_atual < p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente com você: disponível %, solicitado %', COALESCE(v_saldo_atual, 0), p_quantidade;
  END IF;

  UPDATE public.consumivel_saldo_tecnico
  SET quantidade = quantidade - p_quantidade, updated_at = now()
  WHERE tecnico_id = auth.uid() AND produto_id = p_produto_id;

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, tecnico_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'saida_consumo', auth.uid(), p_quantidade, auth.uid(), p_observacao);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.lancar_uso_consumivel(UUID, NUMERIC, TEXT) TO authenticated;

-- Técnico self-service: devolve consumível não usado de volta à sede.
CREATE OR REPLACE FUNCTION public.devolver_consumivel_sede(
  p_produto_id UUID,
  p_quantidade NUMERIC,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_estoque_geral_id UUID;
  v_saldo_atual NUMERIC;
BEGIN
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  SELECT quantidade INTO v_saldo_atual
  FROM public.consumivel_saldo_tecnico
  WHERE tecnico_id = auth.uid() AND produto_id = p_produto_id
  FOR UPDATE;

  IF v_saldo_atual IS NULL OR v_saldo_atual < p_quantidade THEN
    RAISE EXCEPTION 'Saldo insuficiente com você: disponível %, solicitado %', COALESCE(v_saldo_atual, 0), p_quantidade;
  END IF;

  SELECT id INTO v_estoque_geral_id FROM public.estoques WHERE tipo = 'geral' LIMIT 1;

  UPDATE public.consumivel_saldo_tecnico
  SET quantidade = quantidade - p_quantidade, updated_at = now()
  WHERE tecnico_id = auth.uid() AND produto_id = p_produto_id;

  INSERT INTO public.estoque_saldo (estoque_id, produto_id, quantidade)
  VALUES (v_estoque_geral_id, p_produto_id, p_quantidade)
  ON CONFLICT (estoque_id, produto_id)
  DO UPDATE SET quantidade = estoque_saldo.quantidade + EXCLUDED.quantidade, updated_at = now();

  INSERT INTO public.movimentacoes_estoque (
    produto_id, tipo_movimento, estoque_destino_id, tecnico_id, quantidade, usuario_responsavel_id, observacao
  )
  VALUES (p_produto_id, 'devolucao_sede', v_estoque_geral_id, auth.uid(), p_quantidade, auth.uid(), p_observacao);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.devolver_consumivel_sede(UUID, NUMERIC, TEXT) TO authenticated;
