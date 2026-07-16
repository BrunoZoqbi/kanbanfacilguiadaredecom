import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClassificacaoProspeccao, Prospeccao, StatusProspeccao } from '@/types/prospeccao';
import { buildIlikeOrFilter } from '@/lib/searchFilter';

const DEFAULT_PAGE_SIZE = 20;

export interface UseProspeccoesInfiniteOptions {
  search?: string;
  classificacao?: ClassificacaoProspeccao | '';
  status?: StatusProspeccao | '';
  pageSize?: number;
  enabled?: boolean;
}

// Paginação por cursor para a lista de Prospecção — RLS já escopa "próprias"
// para não-admins e "todas" para admins; aqui só paginamos e buscamos dentro
// do que a RLS já libera. Os cards de métricas e os gráficos continuam
// usando useProspeccoes() (fetch completo), já que dependem do conjunto
// inteiro para agregações corretas.
export const useProspeccoesInfinite = ({
  search = '',
  classificacao = '',
  status = '',
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseProspeccoesInfiniteOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['prospeccoes-infinite', search, classificacao, status, pageSize],
    queryFn: async ({ pageParam }) => {
      let request = supabase.from('prospeccoes').select('*');

      if (classificacao) request = request.eq('classificacao', classificacao);
      if (status) request = request.eq('status', status);

      const term = search.trim();
      if (term) {
        request = request.or(buildIlikeOrFilter(term, ['nome_contato', 'telefone_whatsapp', 'endereco']));
      }

      const { data, error } = await request
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;

      const prospeccoes = (data || []) as Prospeccao[];

      return {
        prospeccoes,
        nextOffset: prospeccoes.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: enabled && !!user,
  });

  const prospeccoes = useMemo(
    () => query.data?.pages.flatMap((page) => page.prospeccoes) ?? [],
    [query.data]
  );

  return { ...query, prospeccoes };
};
