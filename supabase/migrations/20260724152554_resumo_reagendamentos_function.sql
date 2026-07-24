-- Métricas de reagendamento de tarefas (aba "Reagendamentos" do Dashboard).
-- SECURITY DEFINER porque agrega dados de todos os usuários (além do que a
-- RLS de tasks libera para quem chama) — checagem de papel (is_admin())
-- feita explicitamente dentro da função.
CREATE OR REPLACE FUNCTION public.resumo_reagendamentos(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  total_tarefas bigint,
  cumpridas_no_prazo bigint,
  reagendadas bigint,
  atrasadas bigint,
  pct_cumpridas numeric,
  pct_reagendadas numeric,
  pct_atrasadas numeric,
  por_motivo jsonb,
  por_usuario jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint as total_tarefas,
    count(*) FILTER (WHERE reagendamento_count = 0 AND (status = 'done' OR due_date >= now()))::bigint as cumpridas_no_prazo,
    count(*) FILTER (WHERE reagendamento_count > 0)::bigint as reagendadas,
    count(*) FILTER (WHERE due_date < now() AND status != 'done' AND reagendamento_count = 0)::bigint as atrasadas,
    round(count(*) FILTER (WHERE reagendamento_count = 0 AND (status = 'done' OR due_date >= now())) * 100.0 / NULLIF(count(*), 0), 1) as pct_cumpridas,
    round(count(*) FILTER (WHERE reagendamento_count > 0) * 100.0 / NULLIF(count(*), 0), 1) as pct_reagendadas,
    round(count(*) FILTER (WHERE due_date < now() AND status != 'done' AND reagendamento_count = 0) * 100.0 / NULLIF(count(*), 0), 1) as pct_atrasadas,
    jsonb_build_object(
      'pedido_tecnico', count(*) FILTER (WHERE reagendamento_motivo = 'pedido_tecnico'),
      'pedido_cliente', count(*) FILTER (WHERE reagendamento_motivo = 'pedido_cliente'),
      'condicao_externa', count(*) FILTER (WHERE reagendamento_motivo = 'condicao_externa'),
      'outro', count(*) FILTER (WHERE reagendamento_motivo = 'outro')
    ) as por_motivo,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'usuario', p.full_name,
        'total', count(t2.id),
        'cumpridas', count(t2.id) FILTER (WHERE t2.reagendamento_count = 0 AND (t2.status = 'done' OR t2.due_date >= now())),
        'reagendadas', count(t2.id) FILTER (WHERE t2.reagendamento_count > 0),
        'atrasadas', count(t2.id) FILTER (WHERE t2.due_date < now() AND t2.status != 'done' AND t2.reagendamento_count = 0)
      ))
      FROM tasks t2
      JOIN profiles p ON p.id = t2.assignee_id
      WHERE (p_start_date IS NULL OR t2.due_date::date >= p_start_date)
        AND (p_end_date IS NULL OR t2.due_date::date <= p_end_date)
      GROUP BY p.id, p.full_name
    ) as por_usuario
  FROM tasks
  WHERE (p_start_date IS NULL OR due_date::date >= p_start_date)
    AND (p_end_date IS NULL OR due_date::date <= p_end_date);
END;
$$;

-- Este projeto concede EXECUTE a PUBLIC (padrão do Postgres na criação de
-- função) e também a `anon` via ALTER DEFAULT PRIVILEGES — os dois precisam
-- ser revogados explicitamente ou o advisor de segurança aponta a função
-- como acessível sem login (ver lição em CLAUDE.md).
REVOKE EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) TO authenticated;
