import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ClassificacaoProspeccao,
  Prospeccao,
  StatusProspeccao,
  TipoContatoProspeccao,
  calcularClassificacao,
} from '@/types/prospeccao';
import { toast } from 'sonner';

interface RespostaInput {
  pergunta: string;
  resposta_selecionada: string;
  pontos: number;
}

interface CreateProspeccaoInput {
  nome_contato: string;
  telefone_whatsapp: string;
  provedor_atual?: string | null;
  tipo_contato: TipoContatoProspeccao;
  endereco?: string | null;
  data_contato: string;
  observacoes?: string | null;
  respostas: RespostaInput[];
}

export const useProspeccoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // RLS already scopes this to "own" rows for non-admins and "all" for
  // admins — no extra filtering needed to get "Minhas" vs "Todas".
  const { data: prospeccoes = [], isLoading } = useQuery({
    queryKey: ['prospeccoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospeccoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Prospeccao[];
    },
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['prospeccoes'] });
  };

  const createProspeccao = useMutation({
    mutationFn: async (input: CreateProspeccaoInput) => {
      if (!user) throw new Error('Não autenticado');

      const pontuacaoTotal = input.respostas.reduce((sum, r) => sum + r.pontos, 0);
      const classificacao: ClassificacaoProspeccao = calcularClassificacao(pontuacaoTotal);

      const { data: prospeccao, error } = await supabase
        .from('prospeccoes')
        .insert([
          {
            nome_contato: input.nome_contato,
            telefone_whatsapp: input.telefone_whatsapp,
            provedor_atual: input.provedor_atual || null,
            tipo_contato: input.tipo_contato,
            endereco: input.endereco || null,
            data_contato: input.data_contato,
            observacoes: input.observacoes || null,
            vendedor_responsavel_id: user.id,
            pontuacao_total: pontuacaoTotal,
            classificacao,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (input.respostas.length > 0) {
        const { error: respostasError } = await supabase.from('prospeccoes_respostas').insert(
          input.respostas.map((r) => ({
            prospeccao_id: prospeccao.id,
            pergunta: r.pergunta,
            resposta_selecionada: r.resposta_selecionada,
            pontos: r.pontos,
          }))
        );
        if (respostasError) throw respostasError;
      }

      // Prospecções quentes (classificação Alta) geram automaticamente uma
      // tarefa de follow-up no Kanban, atribuída ao próprio vendedor.
      if (classificacao === 'alta') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2);

        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            title: `Enviar proposta para ${input.nome_contato}`,
            description: `Prospecção classificada como Alta (${pontuacaoTotal} pontos). Contato: ${input.telefone_whatsapp}`,
            assignee_id: user.id,
            created_by_id: user.id,
            priority: 'high',
            due_date: dueDate.toISOString(),
          })
          .select()
          .single();

        if (taskError) throw taskError;

        const { error: linkError } = await supabase
          .from('prospeccoes')
          .update({ task_id_gerada: task.id })
          .eq('id', prospeccao.id);
        if (linkError) throw linkError;

        return { ...prospeccao, task_id_gerada: task.id } as Prospeccao;
      }

      return prospeccao as Prospeccao;
    },
    onSuccess: (data) => {
      invalidate();
      if (data.task_id_gerada) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.success('Prospecção cadastrada! Tarefa de proposta criada no Kanban.');
      } else {
        toast.success('Prospecção cadastrada!');
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar prospecção: ' + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusProspeccao }) => {
      const { error } = await supabase.from('prospeccoes').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Status atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const updateObservacoes = useMutation({
    mutationFn: async ({ id, observacoes }: { id: string; observacoes: string }) => {
      const { error } = await supabase
        .from('prospeccoes')
        .update({ observacoes: observacoes || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Observações atualizadas!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar observações: ' + error.message);
    },
  });

  return {
    prospeccoes,
    isLoading,
    createProspeccao,
    updateStatus,
    updateObservacoes,
  };
};
