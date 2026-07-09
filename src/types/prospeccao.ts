export type TipoContatoProspeccao = 'visita' | 'ligacao';
export type ClassificacaoProspeccao = 'baixa' | 'media' | 'alta';
export type StatusProspeccao = 'novo' | 'em_negociacao' | 'convertido' | 'perdido';

export interface Prospeccao {
  id: string;
  nome_contato: string;
  endereco: string | null;
  telefone_whatsapp: string;
  provedor_atual: string | null;
  tipo_contato: TipoContatoProspeccao;
  data_contato: string;
  vendedor_responsavel_id: string;
  pontuacao_total: number;
  classificacao: ClassificacaoProspeccao;
  observacoes: string | null;
  status: StatusProspeccao;
  data_retorno_prevista: string | null;
  task_id_gerada: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspeccaoResposta {
  id: string;
  prospeccao_id: string;
  pergunta: string;
  resposta_selecionada: string;
  pontos: number;
}

export const TIPO_CONTATO_LABELS: Record<TipoContatoProspeccao, string> = {
  visita: 'Visita',
  ligacao: 'Ligação',
};

export const STATUS_PROSPECCAO_LABELS: Record<StatusProspeccao, string> = {
  novo: 'Novo',
  em_negociacao: 'Em negociação',
  convertido: 'Convertido',
  perdido: 'Perdido',
};

export const CLASSIFICACAO_LABELS: Record<ClassificacaoProspeccao, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

// Tailwind classes for the classification badge (vermelho/amarelo/verde).
export const CLASSIFICACAO_BADGE_CLASSES: Record<ClassificacaoProspeccao, string> = {
  baixa: 'bg-red-500/10 text-red-700 border-red-500/30',
  media: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  alta: 'bg-green-500/15 text-green-600 border-green-500/30',
};

// Mesmo hex das classes acima (Tailwind default bg-*-500), para o gráfico
// de pizza de classificação usar exatamente a cor do badge.
export const CLASSIFICACAO_CHART_COLORS: Record<ClassificacaoProspeccao, string> = {
  baixa: '#ef4444', // red-500
  media: '#f59e0b', // amber-500
  alta: '#22c55e', // green-500
};

export interface ChecklistOpcao {
  label: string;
  pontos: number;
}

export interface ChecklistPergunta {
  id: string;
  pergunta: string;
  opcoes: ChecklistOpcao[];
}

export const CHECKLIST_PERGUNTAS: ChecklistPergunta[] = [
  {
    id: 'provedor_atual',
    pergunta: 'Provedor atual',
    opcoes: [
      { label: 'Não tem/informal', pontos: 5 },
      { label: 'Concorrente pequeno/regional', pontos: 4 },
      { label: 'Concorrente grande - Vivo/Claro/Oi', pontos: 2 },
    ],
  },
  {
    id: 'satisfacao_cliente',
    pergunta: 'Satisfação do cliente (0-10)',
    opcoes: [
      { label: 'Nota 0-4', pontos: 5 },
      { label: 'Nota 5-7', pontos: 3 },
      { label: 'Nota 8-10', pontos: 1 },
    ],
  },
  {
    id: 'fidelidade_contrato',
    pergunta: 'Fidelidade/contrato',
    opcoes: [
      { label: 'Sem fidelidade ou vencida', pontos: 5 },
      { label: 'Vence em até 3 meses', pontos: 3 },
      { label: 'Vence em mais de 3 meses', pontos: 1 },
      { label: 'Não soube informar', pontos: 2 },
    ],
  },
  {
    id: 'valor_pago',
    pergunta: 'Valor pago hoje',
    opcoes: [
      { label: 'Paga mais que a Fibron', pontos: 5 },
      { label: 'Valor parecido', pontos: 3 },
      { label: 'Paga menos', pontos: 1 },
    ],
  },
  {
    id: 'poder_decisao',
    pergunta: 'Poder de decisão do contato',
    opcoes: [
      { label: 'É o titular/quem paga', pontos: 5 },
      { label: 'Cônjuge/familiar direto', pontos: 3 },
      { label: 'Não decide', pontos: 1 },
    ],
  },
  {
    id: 'motivo_urgencia',
    pergunta: 'Motivo/urgência',
    opcoes: [
      { label: 'Motivo forte e recorrente', pontos: 5 },
      { label: 'Motivo pontual', pontos: 3 },
      { label: 'Só comparando preço', pontos: 2 },
    ],
  },
  {
    id: 'viabilidade_tecnica',
    pergunta: 'Viabilidade técnica',
    opcoes: [
      { label: 'Rede já passa na rua/poste próximo', pontos: 5 },
      { label: 'Precisa expansão curta', pontos: 2 },
      { label: 'Precisa expansão significativa', pontos: 0 },
    ],
  },
];

export const calcularClassificacao = (pontuacaoTotal: number): ClassificacaoProspeccao => {
  if (pontuacaoTotal <= 13) return 'baixa';
  if (pontuacaoTotal <= 24) return 'media';
  return 'alta';
};
