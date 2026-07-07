import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProspeccaoResposta } from '@/types/prospeccao';

export const useProspeccaoRespostas = (prospeccaoId: string | null) => {
  const { data: respostas = [], isLoading } = useQuery({
    queryKey: ['prospeccoes_respostas', prospeccaoId],
    queryFn: async () => {
      // Sem coluna de ordem na tabela — a ordem de exibição é resolvida no
      // componente, casando cada resposta com CHECKLIST_PERGUNTAS pelo texto
      // da pergunta, não pela ordem de retorno da query.
      const { data, error } = await supabase
        .from('prospeccoes_respostas')
        .select('*')
        .eq('prospeccao_id', prospeccaoId!);

      if (error) throw error;
      return data as ProspeccaoResposta[];
    },
    enabled: !!prospeccaoId,
  });

  return { respostas, isLoading };
};
