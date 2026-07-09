import React from 'react';
import { useTicketStats } from '@/hooks/useTicketStats';
import { StatusTicket, STATUS_TICKET_LABELS } from '@/types/tickets';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const DashboardTicketsResumo: React.FC = () => {
  const { stats, isLoading } = useTicketStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
  );
};

export default DashboardTicketsResumo;
