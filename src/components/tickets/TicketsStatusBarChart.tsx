import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { StatusTicket, STATUS_TICKET_LABELS, STATUS_TICKET_CHART_COLORS } from '@/types/tickets';
import { TicketStats } from '@/hooks/useTicketStats';

const PREF_KEY = 'chart_pref_tickets_status';

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
  const [chartType, setChartType] = useState<'bar' | 'pie'>(() => {
    return (localStorage.getItem(PREF_KEY) as 'bar' | 'pie') || 'bar';
  });

  const handleChartTypeChange = (type: 'bar' | 'pie') => {
    setChartType(type);
    localStorage.setItem(PREF_KEY, type);
  };

  const pieData = data.filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base flex items-center gap-2 flex-1">
            <BarChart2 className="h-4 w-4" />
            Chamados por Status
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleChartTypeChange('bar')}
              className={`p-1 rounded transition-colors ${chartType === 'bar' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Ver como barras"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleChartTypeChange('pie')}
              className={`p-1 rounded transition-colors ${chartType === 'pie' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              aria-label="Ver como pizza"
            >
              <PieChartIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartType === 'bar' ? (
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
        ) : (
          <ChartContainer config={STATUS_CHART_CONFIG} className="mx-auto aspect-square max-h-[260px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={pieData} dataKey="value" nameKey="status" innerRadius={55} strokeWidth={2}>
                {pieData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketsStatusBarChart;
