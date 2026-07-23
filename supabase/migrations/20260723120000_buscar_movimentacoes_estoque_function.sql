-- Busca + paginação server-side para a nova aba "Histórico" do módulo de
-- Estoque (tela de leitura de movimentacoes_estoque, que hoje não tem UI).
--
-- SECURITY DEFINER + checagem de is_admin() OR is_gestor_tecnico() interna:
-- a RLS de SELECT em movimentacoes_estoque hoje é aberta ("Everyone can view
-- movimentacoes" / USING true), então confiar em SECURITY INVOKER não
-- restringiria a leitura como pretendido aqui — mesmo padrão de
-- admin_buscar_usuarios (checagem de papel dentro da função, sem mexer na
-- RLS existente da tabela).
CREATE OR REPLACE FUNCTION public.buscar_movimentacoes_estoque(
  p_search TEXT DEFAULT NULL,
  p_tipo TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 30,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  tipo_movimento public.tipo_movimento_estoque,
  produto_nome TEXT,
  numero_serie TEXT,
  tecnico_nome TEXT,
  quantidade INTEGER,
  observacao TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_admin() OR is_gestor_tecnico()) THEN
    RAISE EXCEPTION 'Sem permissão para consultar o histórico de movimentações';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.created_at,
    m.tipo_movimento,
    p.nome AS produto_nome,
    i.numero_serie,
    prof.full_name AS tecnico_nome,
    m.quantidade,
    m.observacao
  FROM public.movimentacoes_estoque m
  JOIN public.produtos p ON p.id = m.produto_id
  LEFT JOIN public.itens_serializados i ON i.id = m.item_serializado_id
  LEFT JOIN public.profiles prof ON prof.id = m.tecnico_id
  WHERE
    (p_tipo IS NULL OR p_tipo = '' OR m.tipo_movimento::TEXT = p_tipo)
    AND (
      p_search IS NULL OR p_search = '' OR
      p.nome ILIKE '%' || p_search || '%' OR
      i.numero_serie ILIKE '%' || p_search || '%' OR
      prof.full_name ILIKE '%' || p_search || '%' OR
      m.observacao ILIKE '%' || p_search || '%'
    )
  ORDER BY m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_movimentacoes_estoque(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
