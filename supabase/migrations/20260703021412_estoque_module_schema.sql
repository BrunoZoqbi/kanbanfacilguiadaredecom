-- Estoque module: produtos, estoques, itens serializados (com rastreio de
-- série/patrimônio e ciclo de vida sede -> técnico -> cliente) e saldos de
-- consumíveis, mais o histórico de movimentações.
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project.)

CREATE TYPE public.tipo_estoque AS ENUM ('geral', 'tecnico');

CREATE TYPE public.condicao_item AS ENUM ('novo', 'usado', 'recondicionado');

CREATE TYPE public.status_item AS ENUM (
  'disponivel',
  'com_tecnico',
  'instalado_cliente',
  'analise_defeito',
  'baixado'
);

CREATE TYPE public.tipo_movimento_estoque AS ENUM (
  'entrada_compra',
  'retirada_tecnico',
  'instalacao',
  'recolhimento',
  'devolucao_sede',
  'baixa_defeito',
  'descarte'
);

-- Produtos: catálogo de itens (controlados por série/patrimônio ou por saldo)
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  controla_serial BOOLEAN NOT NULL DEFAULT true,
  unidade_medida TEXT DEFAULT 'un',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Estoques: locais físicos/lógicos (sede geral, estoques de técnico, etc.)
CREATE TABLE public.estoques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_estoque NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens serializados: rastreio individual (número de série, patrimônio, MAC)
CREATE TABLE public.itens_serializados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  numero_serie TEXT UNIQUE,
  mac_address TEXT UNIQUE,
  patrimonio TEXT UNIQUE,
  fabricante TEXT,
  modelo TEXT,
  fornecedor TEXT,
  nota_fiscal TEXT,
  valor_aquisicao NUMERIC,
  data_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
  garantia_ate DATE,
  condicao public.condicao_item NOT NULL DEFAULT 'novo',
  status public.status_item NOT NULL DEFAULT 'disponivel',
  estoque_atual_id UUID REFERENCES public.estoques(id),
  tecnico_atual_id UUID REFERENCES auth.users(id),
  cliente_vinculado TEXT,
  os_vinculada TEXT,
  local_instalacao TEXT,
  observacoes TEXT,
  ultima_movimentacao_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Saldo de consumíveis (produtos que não controlam série) por estoque
CREATE TABLE public.estoque_saldo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estoque_id UUID NOT NULL REFERENCES public.estoques(id),
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de movimentações (auditoria de todo o ciclo de vida do item)
CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id),
  item_serializado_id UUID REFERENCES public.itens_serializados(id),
  tipo_movimento public.tipo_movimento_estoque NOT NULL,
  estoque_origem_id UUID REFERENCES public.estoques(id),
  estoque_destino_id UUID REFERENCES public.estoques(id),
  tecnico_id UUID REFERENCES auth.users(id),
  cliente_vinculado TEXT,
  os_vinculada TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  usuario_responsavel_id UUID NOT NULL REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_serializados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_saldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view produtos" ON public.produtos
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage produtos" ON public.produtos
  FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can view estoques" ON public.estoques
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage estoques" ON public.estoques
  FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can view itens" ON public.itens_serializados
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage all itens" ON public.itens_serializados
  FOR ALL USING (public.is_admin());
CREATE POLICY "Tecnicos can update own items" ON public.itens_serializados
  FOR UPDATE USING (tecnico_atual_id = auth.uid());

CREATE POLICY "Everyone can view saldo" ON public.estoque_saldo
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage saldo" ON public.estoque_saldo
  FOR ALL USING (public.is_admin());

CREATE POLICY "Everyone can view movimentacoes" ON public.movimentacoes_estoque
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create movimentacoes" ON public.movimentacoes_estoque
  FOR INSERT WITH CHECK (usuario_responsavel_id = auth.uid());

CREATE TRIGGER update_itens_serializados_updated_at
  BEFORE UPDATE ON public.itens_serializados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Estoque geral da sede (destino padrão de devoluções e origem das retiradas)
INSERT INTO public.estoques (nome, tipo)
VALUES ('Estoque Disponível - Sede Fibron', 'geral');
