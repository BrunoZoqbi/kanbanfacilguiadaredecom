import React from 'react';
import { Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ResumoEstoqueSerializado, StatusItem, STATUS_ITEM_LABELS, STATUS_ITEM_CHART_COLORS } from '@/types/estoque';

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

// Soma todas as categorias/produtos num único total por status — usado
// tanto na Visão Geral do módulo Estoque quanto na aba Estoque do
// Dashboard consolidado, para não duplicar essa conta nos dois lugares.
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
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Itens serializados por status
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default EstoqueStatusPieChart;
