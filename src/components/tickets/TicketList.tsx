import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { useTickets } from '@/hooks/useTickets';
import { useTicketStats } from '@/hooks/useTicketStats';
import {
  PrioridadeTicket,
  PRIORIDADE_TICKET_BADGE_CLASSES,
  PRIORIDADE_TICKET_LABELS,
  StatusTicket,
  STATUS_TICKET_BADGE_CLASSES,
  STATUS_TICKET_CHART_COLORS,
  STATUS_TICKET_LABELS,
} from '@/types/tickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
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
import { BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateTicketDialog from './CreateTicketDialog';
import TicketDetailModal from './TicketDetailModal';

const STATUS_CHART_CONFIG: ChartConfig = (
  Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]
).reduce((config, status) => {
  config[status] = { label: STATUS_TICKET_LABELS[status], color: STATUS_TICKET_CHART_COLORS[status] };
  return config;
}, {} as ChartConfig);

const TicketList: React.FC = () => {
  const { isAdmin } = useAuth();
  const { tickets, isLoading } = useTickets();
  const { data: profiles = [] } = useProfiles();
  const { stats } = useTicketStats();

  const statusChartData = useMemo(
    () =>
      (Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]).map((status) => ({
        status,
        label: STATUS_TICKET_LABELS[status],
        value: stats.porStatus[status],
        fill: STATUS_TICKET_CHART_COLORS[status],
      })),
    [stats]
  );

  const [statusFiltro, setStatusFiltro] = useState('');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? null;

  const filteredTickets = tickets.filter((t) => {
    if (statusFiltro && t.status !== statusFiltro) return false;
    if (prioridadeFiltro && t.prioridade !== prioridadeFiltro) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Tickets</h1>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Chamados por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barras horizontais — labels de status são longos (ex: "Aguardando
              cliente") e cabem melhor no eixo Y em telas estreitas do que
              rotacionados no eixo X. */}
          <ChartContainer config={STATUS_CHART_CONFIG} className="w-full max-h-[260px]">
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="status"
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(status: StatusTicket) => STATUS_TICKET_LABELS[status]}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Bar dataKey="value" radius={4}>
                {statusChartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <CardTitle className="text-base">Chamados ({filteredTickets.length})</CardTitle>
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
