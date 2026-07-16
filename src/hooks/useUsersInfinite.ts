import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/database';

const PAGE_SIZE = 20;

export interface UserWithRoleAndEmail {
  id: string;
  full_name: string;
  is_active: boolean;
  phone_whatsapp: string | null;
  created_at: string;
  email: string | null;
  role: AppRole;
}

export interface UseUsersInfiniteOptions {
  search?: string;
  role?: AppRole | '';
}

// Lista "Gerenciar > Usuários" — busca + paginação rodam no banco via RPC
// (admin_buscar_usuarios, SECURITY DEFINER + gate is_admin() interno, já
// que precisa enxergar auth.users.email), em vez de carregar todos os
// usuários e filtrar só por nome no cliente.
export const useUsersInfinite = ({ search = '', role = '' }: UseUsersInfiniteOptions = {}) => {
  const { user, isAdmin } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['admin-users-infinite', search, role],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('admin_buscar_usuarios', {
        p_search: search.trim() || undefined,
        p_role: role || undefined,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });

      if (error) throw error;

      const users = (data || []) as UserWithRoleAndEmail[];
      return {
        users,
        nextOffset: users.length === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user && isAdmin,
  });

  const users = useMemo(
    () => query.data?.pages.flatMap((page) => page.users) ?? [],
    [query.data]
  );

  return { ...query, users };
};
