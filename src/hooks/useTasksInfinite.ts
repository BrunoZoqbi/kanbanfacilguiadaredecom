import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay, addHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TaskPriority, TaskStatus, TaskWithRelations } from '@/types/database';
import { buildIlikeOrFilter } from '@/lib/searchFilter';

const DEFAULT_PAGE_SIZE = 20;

export interface UseTasksInfiniteOptions {
  status?: TaskStatus;
  assigneeId?: string;
  search?: string;
  priority?: TaskPriority | '';
  taskType?: string;
  tagId?: string;
  dateFilter?: 'today' | 'overdue' | 'upcoming' | '';
  pageSize?: number;
  ascending?: boolean;
  // Pula os relacionamentos pesados (tags/checklist/comentários/anexos) —
  // usado onde só título/status/responsável são exibidos (ex: Reatribuir em
  // Massa), evitando joins desnecessários numa lista que já pode ter várias
  // páginas carregadas ao mesmo tempo.
  light?: boolean;
  enabled?: boolean;
}

// Paginação por cursor (useInfiniteQuery) para listas de tarefas que crescem
// sem limite — hoje usado pela coluna "Feito" do Kanban (a que só cresce),
// por Minhas Tarefas e por Reatribuir em Massa. useTasks() continua
// buscando tudo de uma vez, sem paginação — ele ainda alimenta Dashboard,
// exportações e outras telas que precisam do conjunto completo.
export const useTasksInfinite = ({
  status,
  assigneeId,
  search = '',
  priority = '',
  taskType = '',
  tagId = '',
  dateFilter = '',
  pageSize = DEFAULT_PAGE_SIZE,
  ascending = true,
  light = false,
  enabled = true,
}: UseTasksInfiniteOptions = {}) => {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: [
      'tasks-infinite',
      status,
      assigneeId,
      search,
      priority,
      taskType,
      tagId,
      dateFilter,
      pageSize,
      ascending,
      light,
    ],
    queryFn: async ({ pageParam }) => {
      const relationsSelect = light
        ? '*'
        : `*, task_tags${tagId ? '!inner' : ''}(tag_id, tags(*)), task_checklist_items(*), task_comments(*), task_attachments(*)`;

      let request = supabase.from('tasks').select(relationsSelect);

      if (status) request = request.eq('status', status);
      if (assigneeId) request = request.eq('assignee_id', assigneeId);
      if (priority) request = request.eq('priority', priority);
      if (taskType) request = request.eq('task_type', taskType);
      if (tagId) request = request.eq('task_tags.tag_id', tagId);

      const term = search.trim();
      if (term) {
        request = request.or(buildIlikeOrFilter(term, ['title', 'description']));
      }

      if (dateFilter === 'today') {
        const now = new Date();
        request = request.gte('due_date', startOfDay(now).toISOString()).lte('due_date', endOfDay(now).toISOString());
      } else if (dateFilter === 'overdue') {
        request = request.lt('due_date', new Date().toISOString()).neq('status', 'done');
      } else if (dateFilter === 'upcoming') {
        const now = new Date();
        request = request.gte('due_date', now.toISOString()).lte('due_date', addHours(now, 48).toISOString());
      }

      const { data, error } = await request
        .order('position', { ascending })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;

      const rawTasks = (data || []) as any[];
      const tasks: TaskWithRelations[] = rawTasks.map((task) => ({
        ...task,
        tags: task.task_tags?.map((tt: any) => tt.tags).filter(Boolean) || [],
        checklist_items: task.task_checklist_items || [],
        comments: task.task_comments || [],
        attachments: task.task_attachments || [],
      }));

      return {
        tasks,
        nextOffset: rawTasks.length === pageSize ? pageParam + pageSize : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: enabled && !!user,
  });

  const tasks = useMemo(
    () => query.data?.pages.flatMap((page) => page.tasks) ?? [],
    [query.data]
  );

  return { ...query, tasks };
};
