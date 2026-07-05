-- Scripts de atendimento: biblioteca de textos prontos por setor/categoria,
-- editável pelo admin sem precisar de deploy (aba "Gerenciar" no frontend).
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project.)

CREATE TYPE public.setor_script AS ENUM ('comercial', 'financeiro', 'atendimento_geral');

CREATE TABLE public.scripts_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor public.setor_script NOT NULL,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  observacao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scripts_atendimento ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_scripts_atendimento_updated_at
  BEFORE UPDATE ON public.scripts_atendimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Qualquer usuário autenticado vê os scripts ativos; admin também vê os
-- desativados, para poder reativá-los na aba "Gerenciar".
CREATE POLICY "Todos autenticados veem scripts ativos" ON public.scripts_atendimento
  FOR SELECT USING (ativo = true OR is_admin());

-- Só admin cria/edita/ativa/desativa/exclui scripts.
CREATE POLICY "Admin gerencia scripts" ON public.scripts_atendimento
  FOR ALL USING (is_admin());
