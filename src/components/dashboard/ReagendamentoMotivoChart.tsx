import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis, PieLabelRenderProps } from 'recharts';
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
import {
  ReagendamentoMotivo,
  REAGENDAMENTO_MOTIVO_LABELS,
  REAGENDAMENTO_MOTIVO_CHART_COLORS,
} from '@/types/database';
import { ResumoReagendamentos } from '@/hooks/useReagendamentoStats';

const PREF_KEY = 'chart_pref_reagendamento_motivo';

const MOTIVO_CHART_CONFIG: ChartConfig = (
  Object.keys(REAGENDAMENTO_MOTIVO_LABELS) as ReagendamentoMotivo[]
).reduce((config, motivo) => {
  config[motivo] = { label: REAGENDAMENTO_MOTIVO_LABELS[motivo], color: REAGENDAMENTO_MOTIVO_CHART_COLORS[motivo] };
  return config;
}, {} as ChartConfig);

export interface ReagendamentoMotivoChartDatum {
  motivo: ReagendamentoMotivo;
  value: number;
  fill: string;
}

export const buildReagendamentoMotivoChartData = (
  stats: ResumoReagendamentos | null
): ReagendamentoMotivoChartDatum[] => {
  if (!stats?.por_motivo) return [];
  return (Object.keys(REAGENDAMENTO_MOTIVO_LABELS) as ReagendamentoMotivo[])
    .map((motivo) => ({
      motivo,
      value: Number(stats.por_motivo[motivo] ?? 0),
      fill: REAGENDAMENTO_MOTIVO_CHART_COLORS[motivo],
    }))
    .filter((entry) => entry.value > 0);
};

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, outerRadius, value, percent }: PieLabelRenderProps) => {
  if ((percent ?? 0) < 0.06) return null;
  const r = (outerRadius as number) * 0.65;
  const x = (cx as number) + r * Math.cos(-midAngle! * RADIAN);
  const y = (cy as number) + r * Math.sin(-midAngle! * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      <tspan x={x} dy="-0.5em">{value}</tspan>
      <tspan x={x} dy="1.3em">{`${((percent ?? 0) * 100).toFixed(0)}%`}</tspan>
    </text>
  );
};

interface ReagendamentoMotivoChartProps {
  data: ReagendamentoMotivoChartDatum[];
}

const ReagendamentoMotivoChart: React.FC<ReagendamentoMotivoChartProps> = ({ data }) => {
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
            <PieChartIcon className="h-4 w-4" />
            Distribuição por Motivo de Reagendamento
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
          <ChartContainer config={MOTIVO_CHART_CONFIG} className="mx-auto aspect-square max-h-[260px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="motivo" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="motivo" strokeWidth={2} label={renderPieLabel} labelLine={false}>
                {data.map((entry) => (
                  <Cell key={entry.motivo} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="motivo" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={MOTIVO_CHART_CONFIG} className="w-full max-h-[260px]">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="motivo"
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(motivo: ReagendamentoMotivo) => REAGENDAMENTO_MOTIVO_LABELS[motivo]}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="motivo" hideLabel />} />
              <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                  <Cell key={entry.motivo} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ReagendamentoMotivoChart;
