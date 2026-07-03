import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Produto } from '@/types/estoque';
import { toast } from 'sonner';

interface CreateProdutoInput {
  nome: string;
  categoria: string;
  controla_serial: boolean;
  unidade_medida?: string;
}

export const useProdutos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Produto[];
    },
    enabled: !!user,
  });

  const createProduto = useMutation({
    mutationFn: async (input: CreateProdutoInput) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as Produto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto cadastrado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar produto: ' + error.message);
    },
  });

  const toggleProdutoActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('produtos')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  return { produtos, isLoading, createProduto, toggleProdutoActive };
};
