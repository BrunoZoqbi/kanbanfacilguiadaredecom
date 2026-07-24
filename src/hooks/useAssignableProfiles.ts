import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from './useIsGestorTecnico';
import { Profile } from '@/types/database';

// Perfis que podem ser escolhidos como responsável por uma tarefa: todos
// para Admin, mas sem outros admins para Gestor Técnico — espelha a RLS
// de tasks (is_gestor_tecnico() AND NOT has_role(assignee_id, 'admin')).
export const useAssignableProfiles = (profiles: Profile[]) => {
  const { isAdmin } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const [assignableProfiles, setAssignableProfiles] = useState<Profile[]>(profiles);

  useEffect(() => {
    let active = true;

    if (isAdmin || !isGestorTecnico) {
      setAssignableProfiles(profiles);
      return;
    }

    (async () => {
      const results = await Promise.all(
        profiles.map(async (profile) => {
          const { data } = await supabase.rpc('has_role', {
            _user_id: profile.id,
            _role: 'admin',
          });
          return { profile, isAdminProfile: !!data };
        })
      );
      if (active) {
        setAssignableProfiles(results.filter((r) => !r.isAdminProfile).map((r) => r.profile));
      }
    })();

    return () => {
      active = false;
    };
  }, [profiles, isAdmin, isGestorTecnico]);

  return assignableProfiles;
};
