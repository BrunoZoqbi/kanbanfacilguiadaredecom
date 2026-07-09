-- Painel quantitativo de Estoque (Admin/Gestor Técnico) — resumo agrupado
-- por categoria + produto de: (1) itens serializados por status e (2)
-- saldo de consumíveis (sede + soma dos técnicos), num único RPC.
--
-- SECURITY INVOKER (padrão): é só leitura agregada, herda a RLS já
-- existente (itens_serializados e estoque_saldo são "Everyone can view";
-- consumivel_saldo_tecnico só é totalmente visível para admin/gestor
-- técnico — exatamente quem este painel é para, então o agregado bate
-- certo para o público-alvo sem precisar duplicar checagem de papel aqui).
CREATE OR REPLACE FUNCTION public.resumo_estoque_por_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'serializados', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'categoria', categoria,
        'produto_id', produto_id,
        'produto_nome', produto_nome,
        'disponivel', disponivel,
        'com_tecnico', com_tecnico,
        'instalado_cliente', instalado_cliente,
        'analise_defeito', analise_defeito,
        'baixado', baixado
      ) ORDER BY categoria, produto_nome)
      FROM (
        SELECT
          p.categoria,
          p.id AS produto_id,
          p.nome AS produto_nome,
          COUNT(*) FILTER (WHERE i.status = 'disponivel') AS disponivel,
          COUNT(*) FILTER (WHERE i.status = 'com_tecnico') AS com_tecnico,
          COUNT(*) FILTER (WHERE i.status = 'instalado_cliente') AS instalado_cliente,
          COUNT(*) FILTER (WHERE i.status = 'analise_defeito') AS analise_defeito,
          COUNT(*) FILTER (WHERE i.status = 'baixado') AS baixado
        FROM public.itens_serializados i
        JOIN public.produtos p ON p.id = i.produto_id
        GROUP BY p.categoria, p.id, p.nome
      ) serial_summary
    ), '[]'::jsonb),
    'consumiveis', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'categoria', categoria,
        'produto_id', produto_id,
        'produto_nome', produto_nome,
        'unidade_medida', unidade_medida,
        'saldo_sede', saldo_sede,
        'saldo_tecnicos', saldo_tecnicos
      ) ORDER BY categoria, produto_nome)
      FROM (
        SELECT
          p.categoria,
          p.id AS produto_id,
          p.nome AS produto_nome,
          p.unidade_medida,
          COALESCE((SELECT SUM(es.quantidade) FROM public.estoque_saldo es WHERE es.produto_id = p.id), 0) AS saldo_sede,
          COALESCE((SELECT SUM(cst.quantidade) FROM public.consumivel_saldo_tecnico cst WHERE cst.produto_id = p.id), 0) AS saldo_tecnicos
        FROM public.produtos p
        WHERE p.controla_serial = false AND p.is_active = true
      ) consumivel_summary
    ), '[]'::jsonb)
  );
$function$;

GRANT EXECUTE ON FUNCTION public.resumo_estoque_por_status() TO authenticated;
