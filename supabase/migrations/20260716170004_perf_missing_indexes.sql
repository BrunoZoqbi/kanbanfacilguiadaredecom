-- I3: Create missing indexes identified in audit.
-- All verified absent from pg_indexes before applying.
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id
  ON public.tasks (assignee_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by_id
  ON public.tasks (created_by_id);

CREATE INDEX IF NOT EXISTS idx_ticket_respostas_ticket_id
  ON public.ticket_respostas (ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_notas_internas_ticket_id
  ON public.ticket_notas_internas (ticket_id);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_produto_id
  ON public.movimentacoes_estoque (produto_id);
