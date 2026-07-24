import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { useTicketsInfinite } from '@/hooks/useTicketsInfinite';
import { useTicketStats } from '@/hooks/useTicketStats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  PrioridadeTicket,
  PRIORIDADE_TICKET_BADGE_CLASSES,
  PRIORIDADE_TICKET_LABELS,
  StatusTicket,
  STATUS_TICKET_BADGE_CLASSES,
  STATUS_TICKET_LABELS,
} from '@/types/tickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Ticket as TicketIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateTicketDialog from './CreateTicketDialog';
import TicketDetailModal from './TicketDetailModal';
import TicketsStatusBarChart, { buildTicketsStatusChartData } from './TicketsStatusBarChart';

const TicketList: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: profiles = [] } = useProfiles();
  const { stats } = useTicketStats();

  const statusChartData = useMemo(() => buildTicketsStatusChartData(stats), [stats]);

  const [statusFiltro, setStatusFiltro] = useState('');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const {
    tickets: filteredTickets,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTicketsInfinite({
    search: debouncedSearch,
    status: statusFiltro as any,
    prioridade: prioridadeFiltro as any,
    pageSize: 20,
  });

  const selectedTicket = filteredTickets.find((t) => t.id === selectedTicketId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <TicketIcon className="h-6 w-6" />
            Tickets
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Todos os chamados de suporte' : 'Chamados atribuídos a você'}
          </p>
        </div>
        <CreateTicketDialog />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]).map((status) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm mb-1">{STATUS_TICKET_LABELS[status]}</div>
              <p className="text-2xl font-bold">{stats.porStatus[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <TicketsStatusBarChart data={statusChartData} />

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, CPF/contrato, telefone ou problema..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFiltro || 'all'} onValueChange={(v) => setStatusFiltro(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_TICKET_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={prioridadeFiltro || 'all'}
              onValueChange={(v) => setPrioridadeFiltro(v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {(Object.keys(PRIORIDADE_TICKET_LABELS) as PrioridadeTicket[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORIDADE_TICKET_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Chamados ({filteredTickets.length}{hasNextPage ? '+' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Problema</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTicketId(ticket.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedTicketId(ticket.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TableCell className="font-medium">#{ticket.numero_ticket}</TableCell>
                    <TableCell>{ticket.nome_cliente}</TableCell>
                    <TableCell>{ticket.tipo_problema}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(STATUS_TICKET_BADGE_CLASSES[ticket.status])}>
                        {STATUS_TICKET_LABELS[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(PRIORIDADE_TICKET_BADGE_CLASSES[ticket.prioridade])}
                      >
                        {PRIORIDADE_TICKET_LABELS[ticket.prioridade]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {profiles.find((p) => p.id === ticket.atendente_id)?.full_name || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {!isLoading && filteredTickets.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">Nenhum ticket encontrado</div>
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

      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
};

export default TicketList;
