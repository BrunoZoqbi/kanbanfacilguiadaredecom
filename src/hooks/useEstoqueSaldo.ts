import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EstoqueSaldoWithProduto } from '@/types/estoque';
import { toast } from 'sonner';

export const useEstoqueSaldo = (estoqueId?: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['estoque-saldo', estoqueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_saldo')
        .select('*, produto:produtos(*)')
        .eq('estoque_id', estoqueId!)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as EstoqueSaldoWithProduto[];
    },
    enabled: !!estoqueId,
  });

  const lancarEntrada = useMutation({
    mutationFn: async ({
      produtoId,
      estoqueId: targetEstoqueId,
      quantidade,
      observacao,
    }: {
      produtoId: string;
      estoqueId: string;
      quantidade: number;
      observacao?: string;
    }) => {
      const { error } = await supabase.rpc('lancar_entrada_consumivel', {
        p_produto_id: produtoId,
        p_estoque_id: targetEstoqueId,
        p_quantidade: quantidade,
        p_observacao: observacao || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque-saldo'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-disponivel-por-produto'] });
      toast.success('Entrada lançada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao lançar entrada: ' + error.message);
    },
  });

  return { ...query, lancarEntrada };
};
