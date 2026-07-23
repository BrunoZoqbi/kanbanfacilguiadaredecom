import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TicketNotaInterna, TicketResposta } from '@/types/tickets';
import { toast } from 'sonner';

export const useTicketDetail = (ticketId: string | null) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: respostas = [], isLoading: isLoadingRespostas } = useQuery({
    queryKey: ['ticket_respostas', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_respostas')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketResposta[];
    },
    enabled: !!ticketId,
  });

  const { data: notasInternas = [], isLoading: isLoadingNotas } = useQuery({
    queryKey: ['ticket_notas_internas', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_notas_internas')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as TicketNotaInterna[];
    },
    enabled: !!ticketId,
  });

  const addResposta = useMutation({
    mutationFn: async ({
      ticket_id,
      texto,
      created_by_id,
    }: {
      ticket_id: string;
      texto: string;
      created_by_id?: string | null;
    }) => {
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.from('ticket_respostas').insert({
        ticket_id,
        autor_id: user.id,
        autor_nome: profile?.full_name || 'Atendente',
        texto,
      });

      if (error) throw error;

      // Notifica quem abriu o ticket, exceto quando quem respondeu é a
      // mesma pessoa. Fire-and-forget: uma falha aqui não deve impedir a
      // resposta de ser registrada.
      if (created_by_id && created_by_id !== user.id) {
        supabase
          .rpc('criar_notificacao', {
            p_user_id: created_by_id,
            p_tipo: 'ticket_resposta',
            p_titulo: 'Resposta no seu ticket',
            p_mensagem: texto.slice(0, 80),
            p_link: '/tickets',
          })
          .then(({ error: notifError }) => {
            if (notifError) console.error('Erro ao criar notificação de resposta de ticket:', notifError);
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket_respostas', ticketId] });
      toast.success('Resposta adicionada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar resposta: ' + error.message);
    },
  });

  const addNotaInterna = useMutation({
    mutationFn: async ({ ticket_id, texto }: { ticket_id: string; texto: string }) => {
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase.from('ticket_notas_internas').insert({
        ticket_id,
        autor_id: user.id,
        texto,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket_notas_internas', ticketId] });
      toast.success('Nota interna adicionada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao adicionar nota interna: ' + error.message);
    },
  });

  return {
    respostas,
    notasInternas,
    isLoading: isLoadingRespostas || isLoadingNotas,
    addResposta,
    addNotaInterna,
  };
};
