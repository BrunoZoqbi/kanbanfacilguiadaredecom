import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RecursoLink {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export type RecursoLinkInsert = Omit<RecursoLink, 'id' | 'created_at'>;
export type RecursoLinkUpdate = Partial<RecursoLinkInsert>;

export function useRecursosLinks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recursos_links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recursos_links')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data as RecursoLink[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: RecursoLinkInsert) => {
      const { data, error } = await supabase
        .from('recursos_links')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_links'] });
      toast({ title: 'Recurso criado com sucesso.' });
    },
    onError: () => toast({ title: 'Erro ao criar recurso.', variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: RecursoLinkUpdate & { id: string }) => {
      const { error } = await supabase
        .from('recursos_links')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_links'] });
      toast({ title: 'Recurso atualizado.' });
    },
    onError: () => toast({ title: 'Erro ao atualizar recurso.', variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recursos_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_links'] });
      toast({ title: 'Recurso removido.' });
    },
    onError: () => toast({ title: 'Erro ao remover recurso.', variant: 'destructive' }),
  });

  return { ...query, create, update, remove };
}
