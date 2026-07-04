import React, { useMemo, useState } from 'react';
import { format, differenceInHours, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  ListTodo,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
  const { tasks, profiles, isLoading } = useTasks();
  const [period, setPeriod] = useState('30');

  const stats = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, parseInt(period));
    
    const filteredTasks = tasks.filter((task) => {
      const createdAt = new Date(task.created_at);
      return isWithinInterval(createdAt, { start: startDate, end: now });
    });

    const completedTasks = filteredTasks.filter((t) => t.status === 'done');
    const overdueTasks = filteredTasks.filter(
      (t) => new Date(t.due_date) < now && t.status !== 'done'
    );
    const todayDue = filteredTasks.filter((t) => {
      const dueDate = new Date(t.due_date);
      return (
        isWithinInterval(dueDate, { start: startOfDay(now), end: endOfDay(now) }) &&
        t.status !== 'done'
      );
    });

    // Calculate average completion time
    let totalCompletionTime = 0;
    let completedWithTime = 0;
    completedTasks.forEach((task) => {
      if (task.completed_at) {
        const hours = differenceInHours(
          new Date(task.completed_at),
          new Date(task.created_at)
        );
        totalCompletionTime += hours;
        completedWithTime++;
      }
    });
    const avgCompletionTime = completedWithTime > 0 ? totalCompletionTime / completedWithTime : 0;

    // On-time rate
    const completedOnTime = completedTasks.filter((t) => {
      if (!t.completed_at) return false;
      return new Date(t.completed_at) <= new Date(t.due_date);
    });
    const onTimeRate = completedTasks.length > 0
      ? (completedOnTime.length / completedTasks.length) * 100
      : 0;

    // Per-user stats
    const userStats = profiles.map((profile) => {
      const userTasks = filteredTasks.filter((t) => t.assignee_id === profile.id);
      const userCompleted = userTasks.filter((t) => t.status === 'done');
      const userOverdue = userTasks.filter(
        (t) => new Date(t.due_date) < now && t.status !== 'done'
      );

      let userAvgTime = 0;
      let userCompletedWithTime = 0;
      userCompleted.forEach((task) => {
        if (task.completed_at) {
          const hours = differenceInHours(
            new Date(task.completed_at),
            new Date(task.created_at)
          );
          userAvgTime += hours;
          userCompletedWithTime++;
        }
      });

      return {
        id: profile.id,
        name: profile.full_name,
        total: userTasks.length,
        completed: userCompleted.length,
        overdue: userOverdue.length,
        avgTime: userCompletedWithTime > 0 ? userAvgTime / userCompletedWithTime : 0,
        completionRate: userTasks.length > 0
          ? (userCompleted.length / userTasks.length) * 100
          : 0,
      };
    }).sort((a, b) => b.completed - a.completed);

    // Tasks by status
    const byStatus = {
      todo: filteredTasks.filter((t) => t.status === 'todo').length,
      doing: filteredTasks.filter((t) => t.status === 'doing').length,
      done: completedTasks.length,
    };

    return {
      total: filteredTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      todayDue: todayDue.length,
      avgCompletionTime,
      onTimeRate,
      userStats,
      byStatus,
      overdueTasks,
      todayDueTasks: todayDue,
    };
  }, [tasks, profiles, period]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatHours = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const handleExportPDF = async () => {
    const { generatePDFReport } = await import('@/utils/exportReports');
    generatePDFReport({ tasks, profiles, period });
  };

  const handleExportExcel = async () => {
    const { generateExcelReport } = await import('@/utils/exportReports');
    generateExcelReport({ tasks, profiles, period });
  };

  return (
    <div className="space-y-6">
      {/* Period selector and export buttons */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold font-display">Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{formatHours(stats.avgCompletionTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* On-time rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conclusão no Prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold">{Math.round(stats.onTimeRate)}%</span>
                <span className="text-sm text-muted-foreground">
                  das tarefas
                </span>
              </div>
              <Progress value={stats.onTimeRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">A Fazer</span>
                <Badge variant="secondary">{stats.byStatus.todo}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fazendo</span>
                <Badge className="bg-status-doing">{stats.byStatus.doing}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Feito</span>
                <Badge className="bg-status-done">{stats.byStatus.done}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vence hoje */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Vence Hoje ({stats.todayDue})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {stats.todayDueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="text-sm flex items-center justify-between">
                  <span className="truncate flex-1">{task.title}</span>
                  <Badge variant="outline" className="ml-2 priority-medium">
                    {format(new Date(task.due_date), 'HH:mm')}
                  </Badge>
                </div>
              ))}
              {stats.todayDue === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma tarefa vence hoje
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking por Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Usuário</th>
                  <th className="text-center py-3 px-4 font-medium">Total</th>
                  <th className="text-center py-3 px-4 font-medium">Concluídas</th>
                  <th className="text-center py-3 px-4 font-medium">Atrasadas</th>
                  <th className="text-center py-3 px-4 font-medium">Tempo Médio</th>
                  <th className="text-center py-3 px-4 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody>
                {stats.userStats.map((user, index) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold flex-shrink-0',
                          index === 0 && 'bg-yellow-500 text-white',
                          index === 1 && 'bg-gray-400 text-white',
                          index === 2 && 'bg-amber-700 text-white',
                          index > 2 && 'bg-muted text-muted-foreground'
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{user.total}</td>
                    <td className="text-center py-3 px-4">
                      <Badge className="bg-status-done">{user.completed}</Badge>
                    </td>
                    <td className="text-center py-3 px-4">
                      {user.overdue > 0 ? (
                        <Badge variant="destructive">{user.overdue}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">{formatHours(user.avgTime)}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={user.completionRate} className="h-2 w-16" />
                        <span className="text-sm">{Math.round(user.completionRate)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Overdue tasks list */}
      {stats.overdueTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Tarefas Atrasadas ({stats.overdue})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Venceu em {format(new Date(task.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {Math.round(differenceInHours(new Date(), new Date(task.due_date)))}h atraso
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
