import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConsumivelSaldoTecnicoWithProduto } from '@/types/estoque';

// Admin/gestor view: all technicians' consumivel balances in a single query.
// Query key prefix matches the per-tech hook so shared invalidation works.
export const useConsumivelSaldoTodos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['consumivel-saldo-tecnico', 'todos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumivel_saldo_tecnico')
        .select('*, produto:produtos(*)')
        .gt('quantidade', 0)
        .order('tecnico_id');

      if (error) throw error;
      return data as ConsumivelSaldoTecnicoWithProduto[];
    },
    enabled: !!user,
  });
};
