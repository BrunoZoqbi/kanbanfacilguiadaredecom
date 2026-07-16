import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// RLS: leitura liberada a todos autenticados (várias telas leem esses
// valores, ex: limite de "Estoque baixo" em EstoqueDisponivel.tsx), escrita
// restrita a admin — mesmo padrão de tags/task_types.
export const useSystemConfig = (key: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: value, isLoading } = useQuery({
    queryKey: ['system-config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.value ?? null;
    },
    enabled: !!user,
  });

  const updateConfig = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from('system_configs')
        .upsert({ key, value: newValue });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config', key] });
      toast.success('Configuração atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar configuração: ' + error.message);
    },
  });

  return { value, isLoading, updateConfig };
};
