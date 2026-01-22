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
import { TaskWithRelations, TaskStatus } from '@/types/database';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskFilters, { TaskFiltersState } from './TaskFilters';
import TaskDetailModal from '../tasks/TaskDetailModal';
import { isPast, isToday, differenceInHours } from 'date-fns';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'doing', title: 'Fazendo' },
  { id: 'done', title: 'Feito' },
];

const KanbanBoard: React.FC = () => {
  const { tasks, profiles, tags, updateTaskStatus, isLoading } = useTasks();
  const { user, isAdmin } = useAuth();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByStatus[column.id]}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
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
