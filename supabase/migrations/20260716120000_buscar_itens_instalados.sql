-- Busca + paginação server-side para a lista "Itens Instalados em Cliente"
-- (LancarRecolhimento.tsx), que hoje carrega TODOS os itens e filtra no
-- cliente por status === 'instalado_cliente' — não escala à medida que o
-- estoque instalado cresce.
--
-- SECURITY INVOKER (padrão): é só leitura, então herda a RLS já existente em
-- itens_serializados ("Everyone can view itens" / FOR SELECT USING (true))
-- em vez de duplicar checagem de papel — não há elevação de privilégio aqui.
CREATE OR REPLACE FUNCTION public.buscar_itens_instalados(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.itens_serializados
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT i.*
  FROM public.itens_serializados i
  JOIN public.produtos p ON p.id = i.produto_id
  WHERE i.status = 'instalado_cliente'
    AND (
      p_search IS NULL OR p_search = '' OR
      i.cliente_vinculado ILIKE '%' || p_search || '%' OR
      i.local_instalacao ILIKE '%' || p_search || '%' OR
      i.numero_serie ILIKE '%' || p_search || '%' OR
      i.mac_address ILIKE '%' || p_search || '%' OR
      i.os_vinculada ILIKE '%' || p_search || '%' OR
      p.nome ILIKE '%' || p_search || '%'
    )
  ORDER BY i.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

GRANT EXECUTE ON FUNCTION public.buscar_itens_instalados(TEXT, INTEGER, INTEGER) TO authenticated;
