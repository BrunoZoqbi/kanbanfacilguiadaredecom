import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsumivelSaldoTecnicoWithProduto } from '@/types/estoque';
import { toast } from 'sonner';

export const useConsumivelSaldoTecnico = (tecnicoId?: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['consumivel-saldo-tecnico', tecnicoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumivel_saldo_tecnico')
        .select('*, produto:produtos(*)')
        .eq('tecnico_id', tecnicoId!)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ConsumivelSaldoTecnicoWithProduto[];
    },
    enabled: !!tecnicoId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['consumivel-saldo-tecnico'] });
    queryClient.invalidateQueries({ queryKey: ['estoque-saldo'] });
    queryClient.invalidateQueries({ queryKey: ['estoque-disponivel-por-produto'] });
  };

  // Admin / gestor técnico only (enforced server-side pela função).
  const retirarParaTecnico = useMutation({
    mutationFn: async ({
      produtoId,
      tecnicoId: targetTecnicoId,
      quantidade,
      observacao,
    }: {
      produtoId: string;
      tecnicoId: string;
      quantidade: number;
      observacao?: string;
    }) => {
      const { error } = await supabase.rpc('retirar_consumivel_para_tecnico', {
        p_produto_id: produtoId,
        p_tecnico_id: targetTecnicoId,
        p_quantidade: quantidade,
        p_observacao: observacao || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Consumível retirado para o técnico!');
    },
    onError: (error: any) => {
      toast.error('Erro ao retirar consumível: ' + error.message);
    },
  });

  // Técnico self-service sobre o próprio saldo.
  const lancarUso = useMutation({
    mutationFn: async ({
      produtoId,
      quantidade,
      observacao,
    }: {
      produtoId: string;
      quantidade: number;
      observacao?: string;
    }) => {
      const { error } = await supabase.rpc('lancar_uso_consumivel', {
        p_produto_id: produtoId,
        p_quantidade: quantidade,
        p_observacao: observacao || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Uso lançado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao lançar uso: ' + error.message);
    },
  });

  // Técnico self-service sobre o próprio saldo.
  const devolverSede = useMutation({
    mutationFn: async ({
      produtoId,
      quantidade,
      observacao,
    }: {
      produtoId: string;
      quantidade: number;
      observacao?: string;
    }) => {
      const { error } = await supabase.rpc('devolver_consumivel_sede', {
        p_produto_id: produtoId,
        p_quantidade: quantidade,
        p_observacao: observacao || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Consumível devolvido à sede!');
    },
    onError: (error: any) => {
      toast.error('Erro ao devolver consumível: ' + error.message);
    },
  });

  return { ...query, retirarParaTecnico, lancarUso, devolverSede };
};
