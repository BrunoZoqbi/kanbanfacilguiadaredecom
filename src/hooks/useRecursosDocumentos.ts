import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RecursoDocumento {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string;
  categoria: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export type RecursoDocumentoInsert = Omit<RecursoDocumento, 'id' | 'created_at'>;
export type RecursoDocumentoUpdate = Partial<RecursoDocumentoInsert>;

export function useRecursosDocumentos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recursos_documentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recursos_documentos')
        .select('*')
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data as RecursoDocumento[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: RecursoDocumentoInsert) => {
      const { data, error } = await supabase
        .from('recursos_documentos')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_documentos'] });
      toast({ title: 'Documento criado com sucesso.' });
    },
    onError: () => toast({ title: 'Erro ao criar documento.', variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: RecursoDocumentoUpdate & { id: string }) => {
      const { error } = await supabase
        .from('recursos_documentos')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_documentos'] });
      toast({ title: 'Documento atualizado.' });
    },
    onError: () => toast({ title: 'Erro ao atualizar documento.', variant: 'destructive' }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recursos_documentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recursos_documentos'] });
      toast({ title: 'Documento removido.' });
    },
    onError: () => toast({ title: 'Erro ao remover documento.', variant: 'destructive' }),
  });

  return { ...query, create, update, remove };
}
