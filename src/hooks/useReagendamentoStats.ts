import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ReagendamentoMotivo } from '@/types/database';

export interface ReagendamentoPorUsuario {
  usuario: string;
  total: number;
  cumpridas: number;
  reagendadas: number;
  atrasadas: number;
}

export interface ResumoReagendamentos {
  total_tarefas: number;
  cumpridas_no_prazo: number;
  reagendadas: number;
  atrasadas: number;
  pct_cumpridas: number | null;
  pct_reagendadas: number | null;
  pct_atrasadas: number | null;
  por_motivo: Record<ReagendamentoMotivo, number>;
  por_usuario: ReagendamentoPorUsuario[] | null;
}

// Métricas de reagendamento (aba "Reagendamentos" do Dashboard, admin-only)
// — vêm todas prontas do RPC resumo_reagendamentos, que já faz a agregação
// no banco em vez de trazer todas as tasks pro cliente pra somar.
export const useReagendamentoStats = (startDate: string | null, endDate: string | null) => {
  const { isAdmin } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumo-reagendamentos', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('resumo_reagendamentos', {
        p_start_date: startDate,
        p_end_date: endDate,
      });
      if (error) throw error;
      return (data?.[0] ?? null) as ResumoReagendamentos | null;
    },
    enabled: isAdmin,
  });

  return { stats: data ?? null, isLoading, error };
};
