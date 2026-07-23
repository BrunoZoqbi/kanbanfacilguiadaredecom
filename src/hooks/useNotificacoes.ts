import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

// Código Postgres para "relation does not exist" — a tabela `notifications`
// ainda não existe no banco (chega num próximo prompt); até lá, o sino e a
// página de Histórico toleram a ausência devolvendo 0 / lista vazia em vez
// de quebrar a UI.
const RELATION_DOES_NOT_EXIST = '42P01';

// `notifications` não está no schema gerado (Database) porque a tabela
// ainda não existe — daí o cast: supabase.from() só aceita nomes de tabela
// já conhecidos do tipo.
const notificationsTable = () => (supabase.from as any)('notifications');

export interface NotificacaoRow {
  id: string;
  user_id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  created_at: string;
}

export const useNotificacoesNaoLidasCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notificacoes-nao-lidas-count', user?.id],
    queryFn: async () => {
      const { count, error } = await notificationsTable()
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('lida', false);

      if (error) {
        if (error.code === RELATION_DOES_NOT_EXIST) return 0;
        throw error;
      }
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
};

export const useNotificacoesInfinite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['notificacoes-infinite', user?.id],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await notificationsTable()
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) {
        if (error.code === RELATION_DOES_NOT_EXIST) {
          return { notificacoes: [] as NotificacaoRow[], nextOffset: undefined };
        }
        throw error;
      }

      const notificacoes = (data || []) as NotificacaoRow[];
      return {
        notificacoes,
        nextOffset: notificacoes.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notificacoes-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas-count'] });
  };

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await notificationsTable().update({ lida: true }).eq('id', id);
      if (error && error.code !== RELATION_DOES_NOT_EXIST) throw error;
    },
    onSuccess: invalidate,
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await notificationsTable()
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      if (error && error.code !== RELATION_DOES_NOT_EXIST) throw error;
    },
    onSuccess: invalidate,
  });

  const notificacoes = useMemo(
    () => query.data?.pages.flatMap((page) => page.notificacoes) ?? [],
    [query.data]
  );

  return { ...query, notificacoes, marcarComoLida, marcarTodasComoLidas };
};
