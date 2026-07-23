import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificacoesInfinite, NotificacaoRow } from '@/hooks/useNotificacoes';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Loader2, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getNotificacaoIcon = (tipo: string) => {
  switch (tipo) {
    case 'task_assigned':
      return <UserPlus className="h-4 w-4 text-primary" />;
    case 'task_due_soon':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'task_overdue':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const Notificacoes: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    notificacoes,
    isLoading: isLoadingNotificacoes,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoesInfinite();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleClickNotificacao = (notificacao: NotificacaoRow) => {
    if (!notificacao.lida) {
      marcarComoLida.mutate(notificacao.id);
    }
    if (notificacao.link) {
      navigate(notificacao.link);
    }
  };

  const temNaoLidas = notificacoes.some((n) => !n.lida);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notificações
            </h1>
            <p className="text-muted-foreground">Histórico completo das suas notificações</p>
          </div>
          {temNaoLidas && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarTodasComoLidas.mutate()}
              disabled={marcarTodasComoLidas.isPending}
            >
              {marcarTodasComoLidas.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Todas as notificações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingNotificacoes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Nenhuma notificação por aqui ainda.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {notificacoes.map((notificacao) => (
                  <button
                    key={notificacao.id}
                    onClick={() => handleClickNotificacao(notificacao)}
                    className={cn(
                      'w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3',
                      !notificacao.lida && 'bg-primary/5'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getNotificacaoIcon(notificacao.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{notificacao.titulo}</p>
                        {!notificacao.lida && (
                          <Badge className="text-xs bg-primary">Nova</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notificacao.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notificacao.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Notificacoes;
