import { useMemo } from 'react';
import { useTickets } from './useTickets';
import { StatusTicket } from '@/types/tickets';

export interface TicketStats {
  total: number;
  porStatus: Record<StatusTicket, number>;
}

// Contagem por status, reaproveitada tanto em TicketList.tsx quanto no
// Dashboard consolidado (AdminDashboard.tsx) — uma única fonte para a
// mesma conta, em vez de recalcular em cada tela que precisar dela.
export const useTicketStats = () => {
  const { tickets, isLoading } = useTickets();

  const stats = useMemo<TicketStats>(() => {
    const porStatus: Record<StatusTicket, number> = {
      aberto: 0,
      em_andamento: 0,
      aguardando_cliente: 0,
      resolvido: 0,
      fechado: 0,
    };
    tickets.forEach((t) => {
      porStatus[t.status] += 1;
    });
    return { total: tickets.length, porStatus };
  }, [tickets]);

  return { stats, isLoading };
};
