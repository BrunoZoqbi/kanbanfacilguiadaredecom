import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CategoriaProduto } from '@/types/estoque';
import { toast } from 'sonner';

// RLS already scopes this to "ativo = true" for non-admins and "all rows"
// for admins — same query works for both the product-form dropdown (active
// only, in practice) and the admin management screen.
export const useCategoriasProduto = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias-produto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as CategoriaProduto[];
    },
    enabled: !!user,
  });

  const createCategoria = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('categorias_produto')
        .insert([{ nome }])
        .select()
        .single();

      if (error) throw error;
      return data as CategoriaProduto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-produto'] });
      toast.success('Categoria cadastrada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar categoria: ' + error.message);
    },
  });

  const updateCategoria = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from('categorias_produto').update({ nome }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-produto'] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });

  const toggleCategoriaAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('categorias_produto')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias-produto'] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar categoria: ' + error.message);
    },
  });

  return { categorias, isLoading, createCategoria, updateCategoria, toggleCategoriaAtivo };
};
