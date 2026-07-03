import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PrioridadeTicket, StatusTicket, Ticket } from '@/types/tickets';
import { toast } from 'sonner';

interface CreateTicketInput {
  nome_cliente: string;
  cpf_ou_contrato: string;
  telefone: string;
  tipo_problema: string;
  descricao: string;
  prioridade: PrioridadeTicket;
}

// RLS already scopes the query: admins/gestores técnicos see every ticket,
// regular users only see tickets where they are the atendente.
export const useTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  const createTicket = useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            nome_cliente: input.nome_cliente,
            cpf_ou_contrato: input.cpf_ou_contrato,
            telefone: input.telefone,
            tipo_problema: input.tipo_problema,
            descricao: input.descricao,
            prioridade: input.prioridade,
            created_by_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Ticket criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar ticket: ' + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusTicket }) => {
      const updates: Partial<Ticket> = { status };
      if (status === 'resolvido') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase.from('tickets').update(updates).eq('id', id);
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

  const updatePrioridade = useMutation({
    mutationFn: async ({ id, prioridade }: { id: string; prioridade: PrioridadeTicket }) => {
      const { error } = await supabase.from('tickets').update({ prioridade }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Prioridade atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar prioridade: ' + error.message);
    },
  });

  const updateAtendente = useMutation({
    mutationFn: async ({ id, atendente_id }: { id: string; atendente_id: string | null }) => {
      const { error } = await supabase.from('tickets').update({ atendente_id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Atendente atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar atendente: ' + error.message);
    },
  });

  return {
    tickets,
    isLoading,
    error,
    createTicket,
    updateStatus,
    updatePrioridade,
    updateAtendente,
  };
};
