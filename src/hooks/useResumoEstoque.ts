import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ResumoEstoque } from '@/types/estoque';

export const useResumoEstoque = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['resumo-estoque'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('resumo_estoque_por_status');
      if (error) throw error;
      return (data as unknown as ResumoEstoque) ?? { serializados: [], consumiveis: [] };
    },
    enabled: !!user,
  });
};
