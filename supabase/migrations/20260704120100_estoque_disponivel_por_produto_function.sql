-- Aggregate "available quantity" for a produto: count of serialized items
-- currently 'disponivel' plus the consumable balance held in the general
-- (sede) stock. Read-only; RLS on itens_serializados/estoque_saldo already
-- allows SELECT to every authenticated user, so this runs as SECURITY
-- INVOKER (no need to bypass RLS).
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project.)

CREATE OR REPLACE FUNCTION public.estoque_disponivel_por_produto(p_produto_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE((
      SELECT count(*)::integer
      FROM itens_serializados
      WHERE produto_id = p_produto_id AND status = 'disponivel'
    ), 0)
    +
    COALESCE((
      SELECT sum(es.quantidade)::integer
      FROM estoque_saldo es
      JOIN estoques e ON e.id = es.estoque_id
      WHERE es.produto_id = p_produto_id AND e.tipo = 'geral'
    ), 0)
$function$;

GRANT EXECUTE ON FUNCTION public.estoque_disponivel_por_produto(UUID) TO authenticated;
