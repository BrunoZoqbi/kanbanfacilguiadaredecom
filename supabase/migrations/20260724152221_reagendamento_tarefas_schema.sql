-- Controle de reagendamento de tarefas: motivo, contagem e observação.
CREATE TYPE public.reagendamento_motivo AS ENUM (
  'pedido_tecnico',
  'pedido_cliente',
  'condicao_externa',
  'outro'
);

ALTER TABLE public.tasks
  ADD COLUMN reagendamento_motivo public.reagendamento_motivo,
  ADD COLUMN reagendamento_count integer NOT NULL DEFAULT 0,
  ADD COLUMN reagendamento_observacao text,
  ADD COLUMN reagendamento_at timestamptz;

-- Gestor Técnico também gerencia categorias e produtos de estoque (é quem
-- opera o módulo no dia a dia); a policy anterior só liberava Admin.
DROP POLICY "Admins can manage categorias" ON public.categorias_produto;
CREATE POLICY "Admins e Gestor Técnico podem gerenciar categorias" ON public.categorias_produto
  FOR ALL USING (is_admin() OR is_gestor_tecnico());

DROP POLICY "Admins can manage produtos" ON public.produtos;
CREATE POLICY "Admins e Gestor Técnico podem gerenciar produtos" ON public.produtos
  FOR ALL USING (is_admin() OR is_gestor_tecnico());
