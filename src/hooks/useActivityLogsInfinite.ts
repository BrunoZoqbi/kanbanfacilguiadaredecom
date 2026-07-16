import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 30;

export interface ActivityLogWithUserName {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user_name: string;
}

export interface UseActivityLogsInfiniteOptions {
  search?: string;
  action?: string;
  entityType?: string;
}

// Lista "Gerenciar > Logs" — busca + paginação (lotes de 30, já que log
// tende a ter volume maior) rodam no banco via RPC (admin_buscar_logs), em
// vez do LIMIT 200 fixo + filtro client-side em JSON.stringify(details) de
// antes.
export const useActivityLogsInfinite = ({
  search = '',
  action = '',
  entityType = '',
}: UseActivityLogsInfiniteOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['activity-logs-infinite', search, action, entityType],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('admin_buscar_logs', {
        p_search: search.trim() || undefined,
        p_action: action || undefined,
        p_entity_type: entityType || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });

      if (error) throw error;

      const logs = (data || []) as ActivityLogWithUserName[];
      return {
        logs,
        nextOffset: logs.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  const logs = useMemo(
    () => query.data?.pages.flatMap((page) => page.logs) ?? [],
    [query.data]
  );

  return { ...query, logs };
};
