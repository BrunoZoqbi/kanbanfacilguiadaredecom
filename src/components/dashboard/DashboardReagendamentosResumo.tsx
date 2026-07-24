import React, { useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReagendamentoStats } from '@/hooks/useReagendamentoStats';
import { Profile, TaskWithRelations, REAGENDAMENTO_MOTIVO_LABELS } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListTodo, CheckCircle2, RefreshCw, AlertTriangle, Users, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReagendamentoMotivoChart, { buildReagendamentoMotivoChartData } from './ReagendamentoMotivoChart';

type PeriodOption = '30' | '60' | '90' | 'custom';

interface DashboardReagendamentosResumoProps {
  tasks: TaskWithRelations[];
  profiles: Profile[];
}

const DashboardReagendamentosResumo: React.FC<DashboardReagendamentosResumoProps> = ({ tasks, profiles }) => {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => {
    if (period === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    const days = parseInt(period, 10);
    return {
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    };
  }, [period, customStart, customEnd]);

  const { stats, isLoading } = useReagendamentoStats(startDate, endDate);

  const motivoChartData = useMemo(() => buildReagendamentoMotivoChartData(stats), [stats]);

  const usuariosOrdenados = useMemo(() => {
    if (!stats?.por_usuario) return [];
    return [...stats.por_usuario]
      .map((u) => ({
        ...u,
        pctCumpridas: u.total > 0 ? (u.cumpridas / u.total) * 100 : 0,
      }))
      .sort((a, b) => a.pctCumpridas - b.pctCumpridas);
  }, [stats]);

  // O RPC agrega por full_name (não expõe o assignee_id); mapeamos de volta
  // pro id via profiles para conseguir filtrar as tarefas reagendadas do
  // usuário ao expandir a linha, sem precisar de uma segunda chamada ao banco.
  // Filtra pelo período em que o reagendamento ACONTECEU (reagendamento_at),
  // não pelo prazo da tarefa (due_date) — uma tarefa reagendada hoje mas com
  // vencimento futuro deve aparecer no período atual mesmo assim.
  const reagendadasPorUsuario = (fullName: string) => {
    const profile = profiles.find((p) => p.full_name === fullName);
    if (!profile) return [];
    return tasks.filter((t) => {
      if (t.assignee_id !== profile.id) return false;
      if ((t.reagendamento_count ?? 0) <= 0) return false;
      if (!t.reagendamento_at) return false;
      const reagendadoEm = t.reagendamento_at.slice(0, 10);
      if (startDate && reagendadoEm < startDate) return false;
      if (endDate && reagendadoEm > endDate) return false;
      return true;
    });
  };

  // Motivos "outro" e "troca_tecnico" são os que mais precisam de revisão
  // manual do Admin: "outro" é texto livre sem categoria fechada, e uma
  // troca de técnico responsável pode indicar um problema recorrente com
  // a pessoa ou com a rota — ambos exigem observação preenchida para
  // aparecer aqui (outro já garante isso via TaskDetailModal).
  const reagendamentosQueRequeremAtencao = useMemo(() => {
    return tasks.filter((t) => {
      if (t.reagendamento_motivo !== 'outro' && t.reagendamento_motivo !== 'troca_tecnico') return false;
      if (!t.reagendamento_observacao) return false;
      if (!t.reagendamento_at) return false;
      const reagendadoEm = t.reagendamento_at.slice(0, 10);
      if (startDate && reagendadoEm < startDate) return false;
      if (endDate && reagendadoEm > endDate) return false;
      return true;
    });
  }, [tasks, startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="flex items-center justify-end flex-wrap gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
            <span className="text-sm text-muted-foreground">até</span>
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
          </div>
        )}
      </div>

      {/* Cards de resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold">{stats?.total_tarefas ?? 0}</p>
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
                <p className="text-sm text-muted-foreground">Cumpridas no Prazo</p>
                <p className="text-2xl font-bold">
                  {stats?.cumpridas_no_prazo ?? 0}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    ({stats?.pct_cumpridas ?? 0}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reagendadas</p>
                <p className="text-2xl font-bold">
                  {stats?.reagendadas ?? 0}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    ({stats?.pct_reagendadas ?? 0}%)
                  </span>
                </p>
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
                <p className="text-2xl font-bold">
                  {stats?.atrasadas ?? 0}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    ({stats?.pct_atrasadas ?? 0}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico por motivo */}
      <ReagendamentoMotivoChart data={motivoChartData} />

      {/* Tabela por usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Desempenho por Técnico/Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Usuário</th>
                  <th className="text-center py-3 px-4 font-medium">Total</th>
                  <th className="text-center py-3 px-4 font-medium">Cumpridas</th>
                  <th className="text-center py-3 px-4 font-medium">% Cumpridas</th>
                  <th className="text-center py-3 px-4 font-medium">Reagendadas</th>
                  <th className="text-center py-3 px-4 font-medium">% Reagendadas</th>
                  <th className="text-center py-3 px-4 font-medium">Atrasadas</th>
                </tr>
              </thead>
              <tbody>
                {usuariosOrdenados.map((u) => {
                  const isExpanded = expandedUser === u.usuario;
                  const pctReagendadas = u.total > 0 ? (u.reagendadas / u.total) * 100 : 0;
                  const tarefasReagendadas = isExpanded ? reagendadasPorUsuario(u.usuario) : [];
                  return (
                    <React.Fragment key={u.usuario}>
                      <tr
                        className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedUser(isExpanded ? null : u.usuario)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium">{u.usuario}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">{u.total}</td>
                        <td className="text-center py-3 px-4">
                          <Badge className="bg-status-done">{u.cumpridas}</Badge>
                        </td>
                        <td className="text-center py-3 px-4">{Math.round(u.pctCumpridas)}%</td>
                        <td className="text-center py-3 px-4">
                          {u.reagendadas > 0 ? (
                            <Badge variant="secondary">{u.reagendadas}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">{Math.round(pctReagendadas)}%</td>
                        <td className="text-center py-3 px-4">
                          {u.atrasadas > 0 ? (
                            <Badge variant="destructive">{u.atrasadas}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b last:border-0 bg-muted/20">
                          <td colSpan={7} className="py-3 px-4">
                            {tarefasReagendadas.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                Nenhuma tarefa reagendada encontrada no período.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {tarefasReagendadas.map((t) => (
                                  <div
                                    key={t.id}
                                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-background border text-sm"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">{t.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Prazo: {format(new Date(t.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        {t.reagendamento_observacao && ` — ${t.reagendamento_observacao}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {t.reagendamento_motivo && (
                                        <Badge variant="outline" className="text-xs">
                                          {REAGENDAMENTO_MOTIVO_LABELS[t.reagendamento_motivo]}
                                        </Badge>
                                      )}
                                      {t.reagendamento_count > 1 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {t.reagendamento_count}x
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {usuariosOrdenados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhum dado no período selecionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Motivos "outro" e "troca_tecnico" chamam atenção do Admin para
          revisar caso a caso — texto livre sem categoria fechada. */}
      {reagendamentosQueRequeremAtencao.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Reagendamentos que requerem atenção (Outro / Troca de Técnico)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reagendamentosQueRequeremAtencao.map((t) => {
                const responsavel = profiles.find((p) => p.id === t.assignee_id);
                return (
                  <div
                    key={t.id}
                    className="rounded-md border border-yellow-200 bg-background p-3 text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium">{t.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.reagendamento_motivo && (
                          <Badge variant="outline" className="text-xs">
                            {REAGENDAMENTO_MOTIVO_LABELS[t.reagendamento_motivo]}
                          </Badge>
                        )}
                        {t.reagendamento_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(t.reagendamento_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Responsável: {responsavel?.full_name ?? 'Sem responsável'}
                    </p>
                    {t.reagendamento_observacao && (
                      <p className="text-sm">{t.reagendamento_observacao}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardReagendamentosResumo;
