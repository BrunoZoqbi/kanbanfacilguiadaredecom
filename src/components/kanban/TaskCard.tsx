import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, differenceInHours, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskWithRelations, TaskPriority, Profile } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, MapPin, CheckCircle2, MessageSquare, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  profiles?: Profile[];
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'priority-low' },
  medium: { label: 'Média', className: 'priority-medium' },
  high: { label: 'Alta', className: 'priority-high' },
  critical: { label: 'Crítica', className: 'priority-critical' },
};

const getDeadlineStatus = (task: TaskWithRelations) => {
  if (task.status === 'done') return 'completed';
  
  const dueDate = new Date(task.due_date);
  const now = new Date();
  const hoursUntilDue = differenceInHours(dueDate, now);
  const createdAt = new Date(task.created_at);
  const hoursSinceCreated = differenceInHours(now, createdAt);

  if (isPast(dueDate)) return 'overdue';
  if (hoursUntilDue <= 24) return 'soon';
  if (hoursSinceCreated <= 24) return 'new';
  return 'normal';
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, profiles = [] }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deadlineStatus = getDeadlineStatus(task);
  const priority = priorityConfig[task.priority];
  const completedItems = task.checklist_items?.filter((i) => i.is_completed).length || 0;
  const totalItems = task.checklist_items?.length || 0;
  const commentCount = task.comments?.length || 0;
  const assignee = profiles.find((p) => p.id === task.assignee_id);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    listeners?.onKeyDown?.(event);
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={cn(
        'task-card animate-slide-in',
        isDragging && 'task-card-dragging',
        deadlineStatus === 'new' && 'deadline-new',
        deadlineStatus === 'soon' && 'deadline-soon',
        deadlineStatus === 'overdue' && 'deadline-overdue',
        deadlineStatus === 'completed' && 'deadline-completed'
      )}
    >
      {/* Priority & Type badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge variant="outline" className={cn('text-xs', priority.className)}>
          {priority.label}
        </Badge>
        {task.task_type === 'daily' && (
          <Badge variant="secondary" className="text-xs">
            Diária
          </Badge>
        )}
        {deadlineStatus === 'overdue' && (
          <Badge variant="destructive" className="text-xs animate-pulse-ring">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Atrasada
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className="font-medium text-foreground mb-2 line-clamp-2">{task.title}</h3>

      {/* Description preview */}
      {task.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Location */}
      {task.location && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{task.location}</span>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}</span>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {completedItems}/{totalItems}
              </span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{commentCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {task.assignee_id && assignee ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {assignee.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {assignee.full_name.split(' ')[0]}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Sem responsável</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
