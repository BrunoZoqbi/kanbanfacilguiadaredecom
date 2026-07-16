import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PrioridadeTicket, StatusTicket, Ticket } from '@/types/tickets';
import { buildIlikeOrFilter } from '@/lib/searchFilter';

const DEFAULT_PAGE_SIZE = 20;

export interface UseTicketsInfiniteOptions {
  search?: string;
  status?: StatusTicket | '';
  prioridade?: PrioridadeTicket | '';
  pageSize?: number;
  enabled?: boolean;
}

// Paginação por cursor para a lista de Tickets — RLS já escopa as linhas
// (admin/gestores veem tudo, usuário comum só os atribuídos a ele); aqui só
// paginamos e buscamos dentro do que a RLS já libera.
export const useTicketsInfinite = ({
  search = '',
  status = '',
  prioridade = '',
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseTicketsInfiniteOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['tickets-infinite', search, status, prioridade, pageSize],
    queryFn: async ({ pageParam }) => {
      let request = supabase.from('tickets').select('*');

      if (status) request = request.eq('status', status);
      if (prioridade) request = request.eq('prioridade', prioridade);

      const term = search.trim();
      if (term) {
        request = request.or(
          buildIlikeOrFilter(term, ['nome_cliente', 'cpf_ou_contrato', 'telefone', 'tipo_problema'])
        );
      }

      const { data, error } = await request
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;

      const tickets = (data || []) as Ticket[];

      return {
        tickets,
        nextOffset: tickets.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: enabled && !!user,
  });

  const tickets = useMemo(
    () => query.data?.pages.flatMap((page) => page.tickets) ?? [],
    [query.data]
  );

  return { ...query, tickets };
};
