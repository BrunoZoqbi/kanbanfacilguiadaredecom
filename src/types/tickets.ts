export type StatusTicket =
  | 'aberto'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'resolvido'
  | 'fechado';

export type PrioridadeTicket = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Ticket {
  id: string;
  numero_ticket: number;
  nome_cliente: string;
  cpf_ou_contrato: string;
  telefone: string;
  tipo_problema: string;
  descricao: string;
  status: StatusTicket;
  prioridade: PrioridadeTicket;
  atendente_id: string | null;
  created_by_id: string;
  sla_prazo: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketResposta {
  id: string;
  ticket_id: string;
  autor_id: string | null;
  autor_nome: string;
  texto: string;
  created_at: string;
}

export interface TicketNotaInterna {
  id: string;
  ticket_id: string;
  autor_id: string;
  texto: string;
  created_at: string;
}

export const STATUS_TICKET_LABELS: Record<StatusTicket, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const STATUS_TICKET_BADGE_CLASSES: Record<StatusTicket, string> = {
  aberto: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400',
  em_andamento: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  aguardando_cliente: 'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400',
  resolvido: 'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400',
  fechado: 'bg-gray-500/15 text-gray-600 border-gray-500/30 dark:text-gray-400',
};

export const PRIORIDADE_TICKET_LABELS: Record<PrioridadeTicket, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORIDADE_TICKET_BADGE_CLASSES: Record<PrioridadeTicket, string> = {
  baixa: 'bg-slate-500/15 text-slate-600 border-slate-500/30 dark:text-slate-400',
  media: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
  alta: 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400',
  urgente: 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400',
};
