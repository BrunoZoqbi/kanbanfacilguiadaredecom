import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScriptAtendimento } from '@/types/scripts';
import { toast } from 'sonner';

interface UpdateScriptInput {
  id: string;
  titulo?: string;
  categoria?: string;
  conteudo?: string;
  observacao?: string | null;
  ordem?: number;
}

// RLS já filtra: usuários comuns só veem scripts com ativo = true; admin vê
// todos (inclusive os desativados, para poder reativá-los em "Gerenciar").
export const useScripts = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: scripts = [], isLoading, error } = useQuery({
    queryKey: ['scripts-atendimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scripts_atendimento')
        .select('*')
        .order('setor', { ascending: true })
        .order('categoria', { ascending: true })
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as ScriptAtendimento[];
    },
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['scripts-atendimento'] });
  };

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateScriptInput) => {
      if (!isAdmin) throw new Error('Apenas administradores podem editar scripts.');

      const { error } = await supabase.from('scripts_atendimento').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Script atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar script: ' + error.message);
    },
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      if (!isAdmin) throw new Error('Apenas administradores podem ativar/desativar scripts.');

      const { error } = await supabase.from('scripts_atendimento').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(variables.ativo ? 'Script ativado!' : 'Script desativado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar script: ' + error.message);
    },
  });

  return {
    scripts,
    isLoading,
    error,
    updateScript,
    toggleAtivo,
  };
};
