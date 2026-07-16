import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskWithRelations, TaskStatus, Profile } from '@/types/database';
import TaskCard from './TaskCard';
import { cn } from '@/lib/utils';
import { Circle, PlayCircle, CheckCircle2 } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskWithRelations[];
  profiles: Profile[];
  onTaskClick: (task: TaskWithRelations) => void;
  // Quando a coluna é paginada (ex: "Feito"), indica que há mais itens além
  // dos já carregados — o badge de contagem passa a exibir "N+" em vez de N.
  hasMore?: boolean;
  // Conteúdo extra renderizado após a lista de tarefas — usado para o botão
  // "Carregar mais" nas colunas paginadas.
  footer?: React.ReactNode;
}

const columnConfig: Record<TaskStatus, { icon: React.ElementType; bgClass: string }> = {
  todo: { icon: Circle, bgClass: 'bg-column-todo' },
  doing: { icon: PlayCircle, bgClass: 'bg-column-doing' },
  done: { icon: CheckCircle2, bgClass: 'bg-column-done' },
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, tasks, profiles, onTaskClick, hasMore, footer }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'kanban-column transition-colors',
        config.bgClass,
        isOver && 'ring-2 ring-primary/50'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              'h-5 w-5',
              id === 'todo' && 'text-status-todo',
              id === 'doing' && 'text-status-doing',
              id === 'done' && 'text-status-done'
            )}
          />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        <span className="flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-foreground/10 text-xs font-medium">
          {tasks.length}{hasMore ? '+' : ''}
        </span>
      </div>

      {/* Tasks container */}
      <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} profiles={profiles} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Icon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa</p>
          </div>
        )}

        {footer}
      </div>
    </div>
  );
};

export default KanbanColumn;
