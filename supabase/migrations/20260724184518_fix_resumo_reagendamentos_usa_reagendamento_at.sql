-- Bug: reagendadas/pct_reagendadas/por_motivo e o campo "reagendadas" de
-- por_usuario filtravam por due_date (prazo da tarefa), igual às métricas
-- de cumprimento — uma tarefa reagendada HOJE mas com vencimento futuro
-- nunca aparecia no período atual, porque due_date caía fora do range.
-- Correção: separa em duas populações. "Métricas de prazo" (total_tarefas,
-- cumpridas_no_prazo, atrasadas, pct_cumpridas, pct_atrasadas) continuam
-- filtradas por due_date. "Métricas de reagendamento" (reagendadas,
-- pct_reagendadas, por_motivo, e o campo reagendadas de por_usuario) agora
-- filtram por reagendamento_at (quando o reagendamento aconteceu).
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
    prazo_agg.total_tarefas,
    prazo_agg.cumpridas_no_prazo,
    reag_agg.reagendadas,
    prazo_agg.atrasadas,
    prazo_agg.pct_cumpridas,
    round(reag_agg.reagendadas * 100.0 / NULLIF(prazo_agg.total_tarefas, 0), 1) as pct_reagendadas,
    prazo_agg.pct_atrasadas,
    reag_agg.por_motivo,
    usuarios_agg.por_usuario
  FROM
    (
      SELECT
        count(*)::bigint as total_tarefas,
        count(*) FILTER (WHERE reagendamento_count = 0 AND (status = 'done' OR due_date >= now()))::bigint as cumpridas_no_prazo,
        count(*) FILTER (WHERE due_date < now() AND status != 'done' AND reagendamento_count = 0)::bigint as atrasadas,
        round(count(*) FILTER (WHERE reagendamento_count = 0 AND (status = 'done' OR due_date >= now())) * 100.0 / NULLIF(count(*), 0), 1) as pct_cumpridas,
        round(count(*) FILTER (WHERE due_date < now() AND status != 'done' AND reagendamento_count = 0) * 100.0 / NULLIF(count(*), 0), 1) as pct_atrasadas
      FROM tasks
      WHERE (p_start_date IS NULL OR due_date::date >= p_start_date)
        AND (p_end_date IS NULL OR due_date::date <= p_end_date)
    ) prazo_agg,
    (
      SELECT
        count(*)::bigint as reagendadas,
        jsonb_build_object(
          'pedido_tecnico', count(*) FILTER (WHERE reagendamento_motivo = 'pedido_tecnico'),
          'pedido_cliente', count(*) FILTER (WHERE reagendamento_motivo = 'pedido_cliente'),
          'condicao_externa', count(*) FILTER (WHERE reagendamento_motivo = 'condicao_externa'),
          'outro', count(*) FILTER (WHERE reagendamento_motivo = 'outro')
        ) as por_motivo
      FROM tasks
      WHERE reagendamento_count > 0
        AND (p_start_date IS NULL OR reagendamento_at::date >= p_start_date)
        AND (p_end_date IS NULL OR reagendamento_at::date <= p_end_date)
    ) reag_agg,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'usuario', p.full_name,
        'total', COALESCE(prazo_u.total, 0),
        'cumpridas', COALESCE(prazo_u.cumpridas, 0),
        'reagendadas', COALESCE(reag_u.reagendadas, 0),
        'atrasadas', COALESCE(prazo_u.atrasadas, 0)
      )) as por_usuario
      FROM profiles p
      LEFT JOIN (
        SELECT
          assignee_id,
          count(*) as total,
          count(*) FILTER (WHERE reagendamento_count = 0 AND (status = 'done' OR due_date >= now())) as cumpridas,
          count(*) FILTER (WHERE due_date < now() AND status != 'done' AND reagendamento_count = 0) as atrasadas
        FROM tasks
        WHERE (p_start_date IS NULL OR due_date::date >= p_start_date)
          AND (p_end_date IS NULL OR due_date::date <= p_end_date)
        GROUP BY assignee_id
      ) prazo_u ON prazo_u.assignee_id = p.id
      LEFT JOIN (
        SELECT
          assignee_id,
          count(*) as reagendadas
        FROM tasks
        WHERE reagendamento_count > 0
          AND (p_start_date IS NULL OR reagendamento_at::date >= p_start_date)
          AND (p_end_date IS NULL OR reagendamento_at::date <= p_end_date)
        GROUP BY assignee_id
      ) reag_u ON reag_u.assignee_id = p.id
      WHERE prazo_u.assignee_id IS NOT NULL OR reag_u.assignee_id IS NOT NULL
    ) usuarios_agg;
END;
$$;

-- CREATE OR REPLACE preserva GRANT/REVOKE já existentes na função, mas
-- reforça explicitamente (idempotente) por segurança.
REVOKE EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.resumo_reagendamentos(date, date) TO authenticated;
