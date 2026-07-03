import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EstoqueSaldoWithProduto } from '@/types/estoque';

export const useEstoqueSaldo = (estoqueId?: string | null) => {
  return useQuery({
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
};
