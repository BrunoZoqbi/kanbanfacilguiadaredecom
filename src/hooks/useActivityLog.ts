import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export type ActivityAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'move' 
  | 'assign' 
  | 'complete' 
  | 'comment' 
  | 'login' 
  | 'logout'
  | 'role_change'
  | 'user_activate'
  | 'user_deactivate';

export type EntityType = 'task' | 'tag' | 'user' | 'comment' | 'checklist' | 'session';

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = useCallback(async ({
    action,
    entityType,
    entityId,
    details,
  }: LogActivityParams) => {
    if (!user) return;

    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || null,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [user]);

  return { logActivity };
};
