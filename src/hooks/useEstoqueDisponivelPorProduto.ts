import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Chama a RPC estoque_disponivel_por_produto (itens serializados
// 'disponivel' + saldo de consumíveis do estoque geral) uma vez por produto
// distinto, em vez de recalcular a mesma lógica no cliente a partir dos
// dados já carregados — mantém banco e frontend como única fonte de verdade.
export const useEstoqueDisponivelPorProduto = (produtoIds: string[]) => {
  const results = useQueries({
    queries: produtoIds.map((produtoId) => ({
      queryKey: ['estoque-disponivel-por-produto', produtoId],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('estoque_disponivel_por_produto', {
          p_produto_id: produtoId,
        });
        if (error) throw error;
        return data ?? 0;
      },
    })),
  });

  const quantidadePorProduto = new Map<string, number>();
  produtoIds.forEach((produtoId, index) => {
    const quantidade = results[index]?.data;
    if (quantidade !== undefined) {
      quantidadePorProduto.set(produtoId, quantidade);
    }
  });

  return quantidadePorProduto;
};
