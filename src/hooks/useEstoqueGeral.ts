import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Estoque } from '@/types/estoque';

// The single 'geral' (sede) stock location: default origin/destination for
// items that aren't currently checked out to a technician.
export const useEstoqueGeral = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['estoque-geral'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoques')
        .select('*')
        .eq('tipo', 'geral')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Estoque | null;
    },
    enabled: !!user,
  });
};
