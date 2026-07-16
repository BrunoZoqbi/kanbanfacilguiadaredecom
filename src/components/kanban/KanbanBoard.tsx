import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { TaskWithRelations, TaskStatus, TaskPriority } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { useTasksInfinite } from '@/hooks/useTasksInfinite';
import { useRealtimeTasks } from '@/hooks/useRealtimeTasks';
import { useAuth } from '@/contexts/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskFilters, { TaskFiltersState } from './TaskFilters';
import TaskDetailModal from '../tasks/TaskDetailModal';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { isPast, isToday, differenceInHours } from 'date-fns';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'doing', title: 'Fazendo' },
  { id: 'done', title: 'Feito' },
];

const KanbanBoard: React.FC = () => {
  const { tasks, profiles, tags, updateTaskStatus, isLoading } = useTasks();
  const { user, isAdmin } = useAuth();
  
  // Enable realtime updates only in the Kanban board
  useRealtimeTasks();
  
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [filters, setFilters] = useState<TaskFiltersState>({
    search: '',
    assignee: '',
    priority: '',
    type: '',
    tag: '',
    dateFilter: '',
  });

  // Coluna "Feito" só cresce (é um arquivo histórico) — paginada
  // separadamente via useTasksInfinite, ordenada da mais recente para a mais
  // antiga. As colunas "A Fazer"/"Fazendo" continuam usando o fetch completo
  // de useTasks(), já que hoje não crescem sem limite.
  const doneColumn = useTasksInfinite({
    status: 'done',
    search: filters.search,
    assigneeId: filters.assignee || undefined,
    priority: (filters.priority || '') as TaskPriority | '',
    taskType: filters.type || '',
    tagId: filters.tag || undefined,
    dateFilter: (filters.dateFilter || '') as 'today' | 'overdue' | 'upcoming' | '',
    ascending: false,
    pageSize: 20,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(searchLower) &&
          !task.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Assignee filter
      if (filters.assignee && task.assignee_id !== filters.assignee) {
        return false;
      }

      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // Type filter
      if (filters.type && task.task_type !== filters.type) {
        return false;
      }

      // Tag filter
      if (filters.tag && !task.tags?.some((t) => t.id === filters.tag)) {
        return false;
      }

      // Date filters
      if (filters.dateFilter) {
        const dueDate = new Date(task.due_date);
        const now = new Date();

        switch (filters.dateFilter) {
          case 'today':
            if (!isToday(dueDate)) return false;
            break;
          case 'overdue':
            if (!isPast(dueDate) || task.status === 'done') return false;
            break;
          case 'upcoming':
            if (differenceInHours(dueDate, now) > 48 || differenceInHours(dueDate, now) < 0)
              return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      todo: [],
      doing: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort by position within each column
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => a.position - b.position);
    });

    return grouped;
  }, [filteredTasks]);

  // Para renderização: "done" usa a lista paginada; "todo"/"doing" mantêm o
  // agrupamento completo. tasksByStatus (acima) continua sendo a fonte para
  // cálculo de posição no drag-and-drop, já que useTasks() ainda busca todas
  // as tarefas — assim a posição de destino nunca colide mesmo com a coluna
  // "Feito" parcialmente carregada na tela.
  const columnTasks: Record<TaskStatus, TaskWithRelations[]> = {
    todo: tasksByStatus.todo,
    doing: tasksByStatus.doing,
    done: doneColumn.tasks,
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if user can move this task
    if (!isAdmin && task.assignee_id !== user?.id) {
      return;
    }

    // Determine the new status
    let newStatus: TaskStatus = task.status;
    
    // Check if dropped on a column
    if (columns.some((col) => col.id === over.id)) {
      newStatus = over.id as TaskStatus;
    } else {
      // Dropped on another task - find that task's column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus !== task.status) {
      updateTaskStatus.mutate({
        id: taskId,
        status: newStatus,
        position: tasksByStatus[newStatus].length,
      });
    }
  };

  const handleTaskClick = (task: TaskWithRelations) => {
    setSelectedTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        profiles={profiles}
        tags={tags}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-1 md:grid-cols-3">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-[85vw] max-w-sm shrink-0 snap-center sm:w-auto sm:max-w-none sm:shrink"
            >
              <KanbanColumn
                id={column.id}
                title={column.title}
                tasks={columnTasks[column.id]}
                profiles={profiles}
                onTaskClick={handleTaskClick}
                hasMore={column.id === 'done' ? doneColumn.hasNextPage : false}
                footer={
                  column.id === 'done' && doneColumn.hasNextPage ? (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => doneColumn.fetchNextPage()}
                        disabled={doneColumn.isFetchingNextPage}
                      >
                        {doneColumn.isFetchingNextPage && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Carregar mais
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} profiles={profiles} />}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};

export default KanbanBoard;
