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

// Lista "Gerenciar > Usuários" — consulta profiles + user_roles diretamente
// (mesma abordagem de Tickets/Prospecções), sem depender da RPC
// admin_buscar_usuarios. A RLS já libera todos os profiles e user_roles para
// admins. E-mail não é exibido na lista; cada linha usa admin_get_user_email
// só quando o diálogo de Editar é aberto.
export const useUsersInfinite = ({ search = '', role = '' }: UseUsersInfiniteOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ['admin-users-infinite', search, role],
    queryFn: async ({ pageParam }) => {
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, is_active, phone_whatsapp, created_at')
        .order('full_name')
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      const term = search.trim();
      if (term) {
        profilesQuery = profilesQuery.or(
          `full_name.ilike.%${term}%,phone_whatsapp.ilike.%${term}%`
        );
      }

      const { data: profiles, error: profilesError } = await profilesQuery;
      if (profilesError) throw profilesError;

      const profileIds = (profiles ?? []).map((p) => p.id);

      const rolesMap = new Map<string, AppRole>();
      if (profileIds.length > 0) {
        const { data: roleRows, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profileIds);
        if (rolesError) throw rolesError;
        (roleRows ?? []).forEach((r) => rolesMap.set(r.user_id, r.role));
      }

      let users: UserWithRoleAndEmail[] = (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        is_active: p.is_active,
        phone_whatsapp: p.phone_whatsapp,
        created_at: p.created_at,
        email: null,
        role: rolesMap.get(p.id) ?? 'user',
      }));

      if (role) {
        users = users.filter((u) => u.role === role);
      }

      return {
        users,
        nextOffset: (profiles?.length ?? 0) === PAGE_SIZE ? pageParam + PAGE_SIZE : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!user,
  });

  const users = useMemo(
    () => query.data?.pages.flatMap((page) => page.users) ?? [],
    [query.data]
  );

  return { ...query, users };
};
