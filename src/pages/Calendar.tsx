import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useTasks } from '@/hooks/useTasks';
import { useProfiles } from '@/hooks/useProfiles';
import AppLayout from '@/components/layout/AppLayout';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { TaskWithRelations } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const Calendar: React.FC = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canSeeAll = isAdmin || isGestorTecnico;

  const { tasks, isLoading: tasksLoading } = useTasks();
  const { data: profiles = [] } = useProfiles();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');

  // Admin/Gestor Técnico: veem todos + filtro opcional por responsável.
  // Outros papéis: só as próprias tarefas, sem opção de ver outras.
  const filteredTasks = useMemo(() => {
    if (canSeeAll) {
      return selectedAssigneeId
        ? tasks.filter((t) => t.assignee_id === selectedAssigneeId)
        : tasks;
    }
    return tasks.filter((t) => t.assignee_id === user?.id);
  }, [tasks, canSeeAll, selectedAssigneeId, user?.id]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, TaskWithRelations[]> = {};
    filteredTasks.forEach((task) => {
      const dateKey = format(new Date(task.due_date), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(task);
    });
    return map;
  }, [filteredTasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev' ? subMonths(currentMonth, 1) : addMonths(currentMonth, 1));
  };

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

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <AppLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Calendário
        </h1>
        <p className="text-muted-foreground">Visualize tarefas por data</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendário de Tarefas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')} aria-label="Mês anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <Button variant="outline" size="icon" onClick={() => navigateMonth('next')} aria-label="Próximo mês">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {canSeeAll && (
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={selectedAssigneeId || 'all'}
                  onValueChange={(v) => setSelectedAssigneeId(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Todos os responsáveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os responsáveis</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tasksLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const hasOverdue = dayTasks.some(
                      (t) => new Date(t.due_date) < new Date() && t.status !== 'done'
                    );

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'min-h-[64px] sm:min-h-[80px] p-2 rounded-lg border transition-all text-left relative',
                          !isCurrentMonth && 'opacity-40',
                          isToday(day) && 'ring-2 ring-primary',
                          isSelected && 'bg-primary/10 border-primary',
                          !isSelected && 'hover:bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium',
                            isToday(day) && 'text-primary font-bold'
                          )}
                        >
                          {format(day, 'd')}
                        </span>

                        {dayTasks.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {dayTasks.slice(0, 4).map((task) => (
                              <span
                                key={task.id}
                                title={task.title}
                                className={cn('h-1.5 w-1.5 rounded-full', priorityColors[task.priority])}
                              />
                            ))}
                            {dayTasks.length > 4 && (
                              <span className="text-[10px] leading-none text-muted-foreground">
                                +{dayTasks.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {hasOverdue && (
                          <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                : 'Selecione uma data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em uma data para ver as tarefas
              </p>
            ) : selectedDateTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma tarefa nesta data
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTask(task);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          priorityColors[task.priority]
                        )}
                      />
                      <span className="text-sm font-medium truncate">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={task.status === 'done' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status === 'todo' && 'A Fazer'}
                        {task.status === 'doing' && 'Fazendo'}
                        {task.status === 'done' && 'Feito'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
      </div>
    </AppLayout>
  );
};

export default Calendar;
