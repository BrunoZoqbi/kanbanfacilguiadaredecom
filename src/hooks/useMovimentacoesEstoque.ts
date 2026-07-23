import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MovimentacaoEstoqueHistorico } from '@/types/estoque';

const PAGE_SIZE = 30;

interface UseMovimentacoesEstoqueOptions {
  search?: string;
  tipo?: string;
}

// Aba "Histórico" do módulo de Estoque — busca + paginação no servidor via
// buscar_movimentacoes_estoque, mesmo padrão de useItensSerializadosDisponiveis.
export const useMovimentacoesEstoque = ({
  search = '',
  tipo = '',
}: UseMovimentacoesEstoqueOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['movimentacoes-estoque', search, tipo],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('buscar_movimentacoes_estoque', {
        p_search: search.trim() || undefined,
        p_tipo: tipo || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });

      if (error) throw error;

      const movimentacoesPagina = (data || []) as MovimentacaoEstoqueHistorico[];
      return {
        movimentacoes: movimentacoesPagina,
        nextOffset:
          movimentacoesPagina.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  const movimentacoes =
    query.data?.pages.flatMap((pagina) => pagina.movimentacoes) ?? [];

  return { ...query, movimentacoes };
};
