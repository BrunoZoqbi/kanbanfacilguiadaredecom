import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskWithRelations } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { toast } from 'sonner';

export const useTasks = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLog();
  
  // Enable realtime updates
  useRealtimeTasks();

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          task_tags(
            tag_id,
            tags(*)
          ),
          task_checklist_items(*),
          task_comments(
            *,
            profiles:user_id(*)
          ),
          task_attachments(*)
        `)
        .order('position', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform the data to include tags array
      return (data || []).map(task => ({
        ...task,
        tags: task.task_tags?.map((tt: any) => tt.tags).filter(Boolean) || [],
        checklist_items: task.task_checklist_items || [],
        comments: task.task_comments?.map((c: any) => ({
          ...c,
          user: c.profiles
        })) || [],
        attachments: task.task_attachments || [],
      })) as TaskWithRelations[];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (taskData: Partial<Task> & { tag_ids?: string[] }) => {
      const { tag_ids, ...task } = taskData;
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: task.title || '',
          description: task.description,
          assignee_id: task.assignee_id,
          created_by_id: user!.id,
          task_type: task.task_type || 'one_time',
          priority: task.priority || 'medium',
          due_date: task.due_date!,
          scheduled_date: task.scheduled_date,
          location: task.location,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add tags if provided
      if (tag_ids && tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tag_id => ({
          task_id: data.id,
          tag_id,
        }));
        await supabase.from('task_tags').insert(tagInserts);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      logActivity({
        action: 'create',
        entityType: 'task',
        entityId: data.id,
        details: { title: data.title },
      });
      toast.success('Tarefa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string; tag_ids?: string[] }) => {
      const { tag_ids, ...taskUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update tags if provided
      if (tag_ids !== undefined) {
        await supabase.from('task_tags').delete().eq('task_id', id);
        if (tag_ids.length > 0) {
          const tagInserts = tag_ids.map((tag_id: string) => ({
            task_id: id,
            tag_id,
          }));
          await supabase.from('task_tags').insert(tagInserts);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      logActivity({
        action: 'update',
        entityType: 'task',
        entityId: data.id,
        details: { title: data.title },
      });
      toast.success('Tarefa atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status, position }: { id: string; status: TaskStatus; position?: number }) => {
      const updates: Partial<Task> = { status };
      if (position !== undefined) {
        updates.position = position;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Erro ao mover tarefa: ' + error.message);
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      logActivity({
        action: 'delete',
        entityType: 'task',
        entityId: id,
      });
      toast.success('Tarefa excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir tarefa: ' + error.message);
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: user!.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Comentário adicionado!');
    },
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .update({ is_completed })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const addChecklistItem = useMutation({
    mutationFn: async ({ taskId, text }: { taskId: string; text: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .insert({
          task_id: taskId,
          text,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Item adicionado!');
    },
  });

  return {
    tasks,
    profiles,
    tags,
    isLoading,
    error,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addComment,
    toggleChecklistItem,
    addChecklistItem,
  };
};
