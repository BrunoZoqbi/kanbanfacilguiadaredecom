import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import { useTickets } from '@/hooks/useTickets';
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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateTicketDialog from './CreateTicketDialog';
import TicketDetailModal from './TicketDetailModal';

const TicketList: React.FC = () => {
  const { isAdmin } = useAuth();
  const { tickets, isLoading } = useTickets();
  const { data: profiles = [] } = useProfiles();

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
