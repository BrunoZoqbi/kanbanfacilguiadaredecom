import { Profile } from './database';

export type TipoEstoque = 'geral' | 'tecnico';
export type CondicaoItem = 'novo' | 'usado' | 'recondicionado';
export type StatusItem =
  | 'disponivel'
  | 'com_tecnico'
  | 'instalado_cliente'
  | 'analise_defeito'
  | 'baixado';
export type TipoMovimentoEstoque =
  | 'entrada_compra'
  | 'retirada_tecnico'
  | 'instalacao'
  | 'recolhimento'
  | 'devolucao_sede'
  | 'baixa_defeito'
  | 'descarte'
  | 'saida_consumo';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  controla_serial: boolean;
  unidade_medida: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Estoque {
  id: string;
  nome: string;
  tipo: TipoEstoque;
  responsavel_id: string | null;
  created_at: string;
}

export interface ItemSerializado {
  id: string;
  produto_id: string;
  numero_serie: string | null;
  mac_address: string | null;
  patrimonio: string | null;
  fabricante: string | null;
  modelo: string | null;
  fornecedor: string | null;
  nota_fiscal: string | null;
  valor_aquisicao: number | null;
  data_entrada: string;
  garantia_ate: string | null;
  condicao: CondicaoItem;
  status: StatusItem;
  estoque_atual_id: string | null;
  tecnico_atual_id: string | null;
  cliente_vinculado: string | null;
  os_vinculada: string | null;
  local_instalacao: string | null;
  observacoes: string | null;
  ultima_movimentacao_em: string;
  created_at: string;
  updated_at: string;
}

export interface ItemSerializadoWithRelations extends ItemSerializado {
  produto?: Produto;
  tecnico_atual?: Profile | null;
}

export interface EstoqueSaldo {
  id: string;
  estoque_id: string;
  produto_id: string;
  quantidade: number;
  updated_at: string;
}

export interface EstoqueSaldoWithProduto extends EstoqueSaldo {
  produto?: Produto;
}

export interface ConsumivelSaldoTecnico {
  id: string;
  tecnico_id: string;
  produto_id: string;
  quantidade: number;
  updated_at: string;
}

export interface ConsumivelSaldoTecnicoWithProduto extends ConsumivelSaldoTecnico {
  produto?: Produto;
}

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  item_serializado_id: string | null;
  tipo_movimento: TipoMovimentoEstoque;
  estoque_origem_id: string | null;
  estoque_destino_id: string | null;
  tecnico_id: string | null;
  cliente_vinculado: string | null;
  os_vinculada: string | null;
  quantidade: number;
  usuario_responsavel_id: string;
  observacao: string | null;
  created_at: string;
}

// Retorno de resumo_estoque_por_status() — painel quantitativo de Estoque
// (EstoqueVisaoGeral.tsx).
export interface ResumoEstoqueSerializado {
  categoria: string;
  produto_id: string;
  produto_nome: string;
  disponivel: number;
  com_tecnico: number;
  instalado_cliente: number;
  analise_defeito: number;
  baixado: number;
}

export interface ResumoEstoqueConsumivel {
  categoria: string;
  produto_id: string;
  produto_nome: string;
  unidade_medida: string | null;
  saldo_sede: number;
  saldo_tecnicos: number;
}

export interface ResumoEstoque {
  serializados: ResumoEstoqueSerializado[];
  consumiveis: ResumoEstoqueConsumivel[];
}

// Categorias de produto são gerenciadas pelo admin na tabela
// categorias_produto (ver useCategoriasProduto) em vez de uma lista fixa.
export interface CategoriaProduto {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

// Categorias de produto que exibem o campo MAC address no cadastro do item
// (comparação por nome, já que categorias agora são texto livre gerenciado
// pelo admin).
export const CATEGORIAS_COM_MAC = ['Roteador', 'ONU', 'Rádio'];

export const CONDICAO_LABELS: Record<CondicaoItem, string> = {
  novo: 'Novo',
  usado: 'Usado',
  recondicionado: 'Recondicionado',
};

export const STATUS_ITEM_LABELS: Record<StatusItem, string> = {
  disponivel: 'Disponível',
  com_tecnico: 'Com técnico',
  instalado_cliente: 'Instalado no cliente',
  analise_defeito: 'Em análise (defeito)',
  baixado: 'Baixado',
};

// Hex do Tailwind default (bg-*-500) — mesma família de cor usada nos
// badges de status de outros módulos (ex: verde para bom/concluído,
// vermelho para ruim/baixa, âmbar para atenção/em andamento), para o
// gráfico de status da Visão Geral do Estoque conversar visualmente com
// o resto do app.
export const STATUS_ITEM_CHART_COLORS: Record<StatusItem, string> = {
  disponivel: '#22c55e', // green-500
  com_tecnico: '#3b82f6', // blue-500
  instalado_cliente: '#a855f7', // purple-500
  analise_defeito: '#f59e0b', // amber-500
  baixado: '#ef4444', // red-500
};
