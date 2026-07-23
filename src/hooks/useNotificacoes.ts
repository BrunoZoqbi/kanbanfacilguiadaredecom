import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

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

const invalidateNotificacoes = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['notificacoes-infinite'] });
  queryClient.invalidateQueries({ queryKey: ['notificacoes-nao-lidas-count'] });
};

export const useNotificacoesNaoLidasCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Realtime: fica aqui porque useNotificacoesNaoLidasCount é chamado
  // globalmente pelo AppLayout — qualquer INSERT em notifications para o
  // usuário logado atualiza tanto o badge do sino quanto a lista da página
  // /notificacoes (se estiver montada), sem precisar recarregar a página.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => invalidateNotificacoes(queryClient)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['notificacoes-nao-lidas-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('lida', false);

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw error;

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

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ lida: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateNotificacoes(queryClient),
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => invalidateNotificacoes(queryClient),
  });

  const notificacoes = useMemo(
    () => query.data?.pages.flatMap((page) => page.notificacoes) ?? [],
    [query.data]
  );

  return { ...query, notificacoes, marcarComoLida, marcarTodasComoLidas };
};
