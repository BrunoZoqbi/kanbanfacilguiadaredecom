import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useTasksInfinite } from '@/hooks/useTasksInfinite';
import AppLayout from '@/components/layout/AppLayout';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Circle,
  PlayCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  AlertTriangle,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskWithRelations, TaskPriority, TaskStatus } from '@/types/database';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Baixa', className: 'priority-low' },
  medium: { label: 'Média', className: 'priority-medium' },
  high: { label: 'Alta', className: 'priority-high' },
  critical: { label: 'Crítica', className: 'priority-critical' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  todo: { label: 'A Fazer', icon: Circle, color: 'text-status-todo' },
  doing: { label: 'Fazendo', icon: PlayCircle, color: 'text-status-doing' },
  done: { label: 'Feito', icon: CheckCircle2, color: 'text-status-done' },
};

const MyTasks: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  // Fetch completo mantido só para os contadores das abas (badges) — a lista
  // renderizada abaixo usa useTasksInfinite, paginada por aba.
  const { tasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');

  const myTasks = useMemo(() => {
    return tasks.filter((task) => task.assignee_id === user?.id);
  }, [tasks, user]);

  const taskCounts = useMemo(() => ({
    all: myTasks.length,
    todo: myTasks.filter((t) => t.status === 'todo').length,
    doing: myTasks.filter((t) => t.status === 'doing').length,
    done: myTasks.filter((t) => t.status === 'done').length,
  }), [myTasks]);

  const {
    tasks: filteredTasks,
    isLoading: tasksLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTasksInfinite({
    assigneeId: user?.id || '',
    status: activeTab !== 'all' ? activeTab : undefined,
    ascending: true,
    pageSize: 20,
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            Minhas Tarefas
          </h1>
          <p className="text-muted-foreground">
            Você tem {taskCounts.todo + taskCounts.doing} tarefas pendentes
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todas ({taskCounts.all})
            </TabsTrigger>
            <TabsTrigger value="todo">
              A Fazer ({taskCounts.todo})
            </TabsTrigger>
            <TabsTrigger value="doing">
              Fazendo ({taskCounts.doing})
            </TabsTrigger>
            <TabsTrigger value="done">
              Feitas ({taskCounts.done})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const priority = priorityConfig[task.priority];
                  const status = statusConfig[task.status];
                  const StatusIcon = status.icon;
                  const isOverdue = isPast(new Date(task.due_date)) && task.status !== 'done';

                  return (
                    <Card
                      key={task.id}
                      className={cn(
                        'cursor-pointer hover:shadow-md transition-shadow',
                        isOverdue && 'border-destructive/50'
                      )}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <StatusIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', status.color)} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className={cn('text-xs', priority.className)}>
                                {priority.label}
                              </Badge>
                              {task.task_type === 'daily' && (
                                <Badge variant="secondary" className="text-xs">
                                  Diária
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Atrasada
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="font-medium mb-1">{task.title}</h3>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {format(new Date(task.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              {task.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-32">{task.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
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
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Carregar mais
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      </div>
    </AppLayout>
  );
};

export default MyTasks;
