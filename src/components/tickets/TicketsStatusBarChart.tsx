import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { StatusTicket, STATUS_TICKET_LABELS, STATUS_TICKET_CHART_COLORS } from '@/types/tickets';
import { TicketStats } from '@/hooks/useTicketStats';

const STATUS_CHART_CONFIG: ChartConfig = (
  Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]
).reduce((config, status) => {
  config[status] = { label: STATUS_TICKET_LABELS[status], color: STATUS_TICKET_CHART_COLORS[status] };
  return config;
}, {} as ChartConfig);

export interface TicketsStatusChartDatum {
  status: StatusTicket;
  label: string;
  value: number;
  fill: string;
}

// Usado tanto em TicketList.tsx quanto na aba Tickets do Dashboard
// consolidado — não duplica a conta nos dois lugares.
export const buildTicketsStatusChartData = (stats: TicketStats): TicketsStatusChartDatum[] =>
  (Object.keys(STATUS_TICKET_LABELS) as StatusTicket[]).map((status) => ({
    status,
    label: STATUS_TICKET_LABELS[status],
    value: stats.porStatus[status],
    fill: STATUS_TICKET_CHART_COLORS[status],
  }));

interface TicketsStatusBarChartProps {
  data: TicketsStatusChartDatum[];
}

const TicketsStatusBarChart: React.FC<TicketsStatusBarChartProps> = ({ data }) => {
  return (
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
          <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
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
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TicketsStatusBarChart;
