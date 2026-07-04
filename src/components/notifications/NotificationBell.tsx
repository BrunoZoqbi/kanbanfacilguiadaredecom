import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_due_soon' | 'task_overdue';
  title: string;
  message: string;
  task_id: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Generate notifications based on tasks
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get tasks assigned to user
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .neq('status', 'done');

      if (!tasks) return [];

      const now = new Date();
      const notifs: Notification[] = [];

      tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const createdAt = new Date(task.created_at);
        const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        // Task recently assigned (last 24h)
        if (hoursSinceCreated <= 24) {
          notifs.push({
            id: `assigned-${task.id}`,
            type: 'task_assigned',
            title: 'Nova tarefa atribuída',
            message: task.title,
            task_id: task.id,
            is_read: false,
            created_at: task.created_at,
          });
        }

        // Task overdue
        if (hoursUntilDue < 0) {
          notifs.push({
            id: `overdue-${task.id}`,
            type: 'task_overdue',
            title: 'Tarefa atrasada!',
            message: task.title,
            task_id: task.id,
            is_read: false,
            created_at: task.due_date,
          });
        }
        // Task due soon (within 24h)
        else if (hoursUntilDue <= 24) {
          notifs.push({
            id: `duesoon-${task.id}`,
            type: 'task_due_soon',
            title: 'Tarefa vence em breve',
            message: task.title,
            task_id: task.id,
            is_read: false,
            created_at: task.due_date,
          });
        }
      });

      // Sort by date
      return notifs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'task_due_soon':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'task_overdue':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold font-display">Notificações</h3>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Tudo em dia!'}
          </p>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                    !notification.is_read && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
