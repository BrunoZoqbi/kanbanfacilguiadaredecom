import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Activity, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
  user_name?: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  create: { label: 'Criou', color: 'bg-green-500' },
  update: { label: 'Atualizou', color: 'bg-blue-500' },
  delete: { label: 'Excluiu', color: 'bg-red-500' },
  move: { label: 'Moveu', color: 'bg-yellow-500' },
  assign: { label: 'Atribuiu', color: 'bg-purple-500' },
  complete: { label: 'Concluiu', color: 'bg-emerald-500' },
  comment: { label: 'Comentou', color: 'bg-cyan-500' },
  login: { label: 'Login', color: 'bg-gray-500' },
  logout: { label: 'Logout', color: 'bg-gray-400' },
  role_change: { label: 'Alterou função', color: 'bg-orange-500' },
  user_activate: { label: 'Ativou usuário', color: 'bg-green-600' },
  user_deactivate: { label: 'Desativou usuário', color: 'bg-red-600' },
};

const entityLabels: Record<string, string> = {
  task: 'Tarefa',
  tag: 'Tag',
  user: 'Usuário',
  comment: 'Comentário',
  checklist: 'Checklist',
  session: 'Sessão',
};

const ActivityLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (logsError) throw logsError;

      // Fetch user names
      const userIds = [...new Set(logsData.map((l) => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      return logsData.map((log) => ({
        ...log,
        user_name: profileMap.get(log.user_id) || 'Usuário desconhecido',
      })) as ActivityLog[];
    },
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const formatDetails = (details: Record<string, any> | null): string => {
    if (!details) return '';
    
    const parts: string[] = [];
    if (details.title) parts.push(`"${details.title}"`);
    if (details.user_name) parts.push(`${details.user_name}`);
    if (details.old_role && details.new_role) {
      parts.push(`de ${details.old_role} para ${details.new_role}`);
    }
    if (details.from_status && details.to_status) {
      parts.push(`de ${details.from_status} para ${details.to_status}`);
    }
    
    return parts.join(' ');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs de Atividade
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              {Object.entries(actionLabels).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEntity} onValueChange={setFilterEntity}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas entidades</SelectItem>
              {Object.entries(entityLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="divide-y">
              {filteredLogs.map((log) => {
                const actionInfo = actionLabels[log.action] || { label: log.action, color: 'bg-gray-500' };
                const entityLabel = entityLabels[log.entity_type] || log.entity_type;
                const details = formatDetails(log.details);

                return (
                  <div key={log.id} className="p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${actionInfo.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.user_name}</span>
                          {' '}
                          <span className="text-muted-foreground">{actionInfo.label.toLowerCase()}</span>
                          {' '}
                          <Badge variant="outline" className="text-xs">
                            {entityLabel}
                          </Badge>
                          {details && (
                            <span className="text-muted-foreground ml-1">{details}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum log encontrado
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLogs;
