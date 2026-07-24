export type SetorScript = 'comercial' | 'financeiro' | 'atendimento_geral' | 'suporte_tecnico';

export interface ScriptAtendimento {
  id: string;
  setor: SetorScript;
  categoria: string;
  titulo: string;
  conteudo: string;
  observacao: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const SETOR_SCRIPT_LABELS: Record<SetorScript, string> = {
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  atendimento_geral: 'Atendimento Geral',
  suporte_tecnico: 'Suporte Técnico',
};

const normalizarCategoria = (categoria: string): string =>
  categoria
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

type CorCategoria = 'verde' | 'azul' | 'laranja' | 'vermelho' | 'cinza';

// Mapa por categoria normalizada (sem acento) -> cor. Só cobre as palavras
// pedidas explicitamente; qualquer categoria fora dessa lista (ex: Rotina de
// Suporte, Desbloqueio, Fechamento) cai no "cinza" neutro em
// getCategoriaBadgeClass, em vez de arriscar um match por substring (ex:
// "desbloqueio" não pode cair em "bloqueio" por engano).
const CATEGORIA_COR: Record<string, CorCategoria> = {
  entrada: 'verde',
  rotina: 'verde',
  proposta: 'azul',
  comercial: 'azul',
  objecao: 'laranja',
  cobranca: 'laranja',
  negociacao: 'laranja',
  critico: 'vermelho',
  bloqueio: 'vermelho',
  encerramento: 'cinza',
  cancelamento: 'cinza',
};

export const CATEGORIA_BADGE_CLASSES: Record<CorCategoria, string> = {
  verde: 'bg-green-500/10 text-green-700 border-green-500/30',
  azul: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  laranja: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  vermelho: 'bg-red-500/10 text-red-700 border-red-500/30',
  cinza: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
};

export const getCategoriaBadgeClass = (categoria: string): string =>
  CATEGORIA_BADGE_CLASSES[CATEGORIA_COR[normalizarCategoria(categoria)] || 'cinza'];
