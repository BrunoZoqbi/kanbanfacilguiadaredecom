-- Prospecção Comercial module: lead capture with a scored qualification
-- checklist (pontuacao_total -> classificacao baixa/media/alta).

CREATE TYPE public.tipo_contato_prospeccao AS ENUM ('visita', 'ligacao');

CREATE TYPE public.classificacao_prospeccao AS ENUM ('baixa', 'media', 'alta');

CREATE TYPE public.status_prospeccao AS ENUM ('novo', 'em_negociacao', 'convertido', 'perdido');

CREATE TABLE public.prospeccoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_contato TEXT NOT NULL,
  endereco TEXT,
  telefone_whatsapp TEXT NOT NULL,
  provedor_atual TEXT,
  tipo_contato public.tipo_contato_prospeccao NOT NULL DEFAULT 'visita',
  data_contato DATE NOT NULL DEFAULT CURRENT_DATE,
  vendedor_responsavel_id UUID NOT NULL REFERENCES auth.users(id),
  pontuacao_total INTEGER NOT NULL DEFAULT 0,
  classificacao public.classificacao_prospeccao NOT NULL DEFAULT 'baixa',
  observacoes TEXT,
  status public.status_prospeccao NOT NULL DEFAULT 'novo',
  data_retorno_prevista DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.prospeccoes_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospeccao_id UUID NOT NULL REFERENCES public.prospeccoes(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta_selecionada TEXT NOT NULL,
  pontos INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.prospeccoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospeccoes_respostas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_prospeccoes_updated_at
  BEFORE UPDATE ON public.prospeccoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_gestor_comercial()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.has_role(auth.uid(), 'gestor_comercial')
$function$;

-- Only admin/gestor comercial create prospecções, and a non-admin can only
-- create their own (vendedor_responsavel_id = auth.uid()).
CREATE POLICY "Cadastro de prospecções por papel" ON public.prospeccoes
  FOR INSERT WITH CHECK (
    (is_admin() OR is_gestor_comercial())
    AND (is_admin() OR vendedor_responsavel_id = auth.uid())
  );

-- Admin sees/edits every prospecção; everyone else only their own — this is
-- what makes "Minhas Prospecções" (gestor comercial) vs "Todas as
-- Prospecções" (admin) just be the same query filtered by RLS.
CREATE POLICY "Visibilidade de prospecções por papel" ON public.prospeccoes
  FOR SELECT USING (is_admin() OR vendedor_responsavel_id = auth.uid());

CREATE POLICY "Atualização de prospecções por papel" ON public.prospeccoes
  FOR UPDATE USING (is_admin() OR vendedor_responsavel_id = auth.uid());

CREATE POLICY "Ver respostas de prospecções acessíveis" ON public.prospeccoes_respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM prospeccoes p
      WHERE p.id = prospeccoes_respostas.prospeccao_id
        AND (is_admin() OR p.vendedor_responsavel_id = auth.uid())
    )
  );

CREATE POLICY "Gerenciar respostas de prospecções próprias" ON public.prospeccoes_respostas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM prospeccoes p
      WHERE p.id = prospeccoes_respostas.prospeccao_id
        AND (is_admin() OR p.vendedor_responsavel_id = auth.uid())
    )
  );
