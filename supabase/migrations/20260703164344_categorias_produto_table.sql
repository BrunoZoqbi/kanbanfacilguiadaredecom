-- Categorias de produto passam a ser gerenciáveis pelo admin em vez de uma
-- lista fixa no código. Soft-delete via `ativo` para não quebrar produtos
-- que já usam a categoria.
CREATE TABLE public.categorias_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active categorias" ON public.categorias_produto
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage categorias" ON public.categorias_produto
  FOR ALL USING (is_admin());

-- Seed with the categories that were previously hardcoded in the frontend.
INSERT INTO public.categorias_produto (nome) VALUES
  ('Roteador'),
  ('ONU'),
  ('Rádio'),
  ('Switch'),
  ('Cabo'),
  ('Conector'),
  ('Splitter'),
  ('Fonte'),
  ('Ferramenta'),
  ('Outro');
