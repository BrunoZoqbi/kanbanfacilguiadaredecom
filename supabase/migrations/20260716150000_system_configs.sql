-- Tabela de configurações do sistema editáveis pelo Admin — primeiro uso é
-- o limite de "Estoque baixo" em EstoqueDisponivel.tsx, hoje fixo em 2
-- unidades no código.
CREATE TABLE public.system_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- Leitura liberada a todos autenticados: várias telas (ex: badge de
-- "Estoque baixo", visível a qualquer usuário que veja o Estoque) precisam
-- ler esses valores, não só o Admin. Só a escrita é restrita — mesmo padrão
-- de "Everyone can view tags" / "Admins can manage tags".
CREATE POLICY "Everyone can view system configs" ON public.system_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage system configs" ON public.system_configs
  FOR ALL TO authenticated USING (public.is_admin());

CREATE TRIGGER update_system_configs_updated_at
  BEFORE UPDATE ON public.system_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_configs (key, value)
VALUES ('estoque_baixo_limite', '2')
ON CONFLICT (key) DO NOTHING;
