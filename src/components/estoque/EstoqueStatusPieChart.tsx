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
import { ResumoEstoqueSerializado, StatusItem, STATUS_ITEM_LABELS, STATUS_ITEM_CHART_COLORS } from '@/types/estoque';

const PREF_KEY = 'chart_pref_estoque_status';

const STATUS_CHART_CONFIG: ChartConfig = (
  Object.keys(STATUS_ITEM_LABELS) as StatusItem[]
).reduce((config, status) => {
  config[status] = { label: STATUS_ITEM_LABELS[status], color: STATUS_ITEM_CHART_COLORS[status] };
  return config;
}, {} as ChartConfig);

export interface EstoqueStatusChartDatum {
  status: StatusItem;
  value: number;
  fill: string;
}

export const buildEstoqueStatusChartData = (
  serializados: ResumoEstoqueSerializado[]
): EstoqueStatusChartDatum[] => {
  const totals: Record<StatusItem, number> = {
    disponivel: 0,
    com_tecnico: 0,
    instalado_cliente: 0,
    analise_defeito: 0,
    baixado: 0,
  };
  serializados.forEach((item) => {
    totals.disponivel += item.disponivel;
    totals.com_tecnico += item.com_tecnico;
    totals.instalado_cliente += item.instalado_cliente;
    totals.analise_defeito += item.analise_defeito;
    totals.baixado += item.baixado;
  });
  return (Object.keys(totals) as StatusItem[])
    .map((status) => ({ status, value: totals[status], fill: STATUS_ITEM_CHART_COLORS[status] }))
    .filter((entry) => entry.value > 0);
};

interface EstoqueStatusPieChartProps {
  data: EstoqueStatusChartDatum[];
}

const EstoqueStatusPieChart: React.FC<EstoqueStatusPieChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>(() => {
    return (localStorage.getItem(PREF_KEY) as 'pie' | 'bar') || 'pie';
  });

  if (data.length === 0) return null;

  const handleChartTypeChange = (type: 'pie' | 'bar') => {
    setChartType(type);
    localStorage.setItem(PREF_KEY, type);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base flex items-center gap-2 flex-1">
            <PieChartIcon className="h-5 w-5" />
            Itens serializados por status
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
        {chartType === 'pie' ? (
          <ChartContainer config={STATUS_CHART_CONFIG} className="mx-auto aspect-square max-h-[280px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="status" innerRadius={55} strokeWidth={2}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={STATUS_CHART_CONFIG} className="w-full max-h-[260px]">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="status"
                tickLine={false}
                axisLine={false}
                width={95}
                tickFormatter={(status: StatusItem) => STATUS_ITEM_LABELS[status]}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default EstoqueStatusPieChart;
