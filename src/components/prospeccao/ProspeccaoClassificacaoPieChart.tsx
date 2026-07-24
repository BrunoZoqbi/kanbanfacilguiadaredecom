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
import { ClassificacaoProspeccao, CLASSIFICACAO_LABELS, CLASSIFICACAO_CHART_COLORS } from '@/types/prospeccao';
import { ProspeccaoStats } from '@/hooks/useProspeccaoStats';

const PREF_KEY = 'chart_pref_prospeccao_classificacao';

const CLASSIFICACAO_CHART_CONFIG: ChartConfig = {
  baixa: { label: CLASSIFICACAO_LABELS.baixa, color: CLASSIFICACAO_CHART_COLORS.baixa },
  media: { label: CLASSIFICACAO_LABELS.media, color: CLASSIFICACAO_CHART_COLORS.media },
  alta: { label: CLASSIFICACAO_LABELS.alta, color: CLASSIFICACAO_CHART_COLORS.alta },
};

export interface ClassificacaoChartDatum {
  classificacao: ClassificacaoProspeccao;
  value: number;
  fill: string;
}

export const buildClassificacaoChartData = (stats: ProspeccaoStats): ClassificacaoChartDatum[] =>
  (['baixa', 'media', 'alta'] as ClassificacaoProspeccao[])
    .map((classificacao) => ({
      classificacao,
      value: stats[classificacao],
      fill: CLASSIFICACAO_CHART_COLORS[classificacao],
    }))
    .filter((entry) => entry.value > 0);

interface ProspeccaoClassificacaoPieChartProps {
  data: ClassificacaoChartDatum[];
}

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

const ProspeccaoClassificacaoPieChart: React.FC<ProspeccaoClassificacaoPieChartProps> = ({ data }) => {
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
            Distribuição por Classificação
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
          <ChartContainer config={CLASSIFICACAO_CHART_CONFIG} className="mx-auto aspect-square max-h-[240px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="classificacao" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="classificacao" strokeWidth={2} label={renderPieLabel} labelLine={false}>
                {data.map((entry) => (
                  <Cell key={entry.classificacao} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="classificacao" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={CLASSIFICACAO_CHART_CONFIG} className="w-full max-h-[240px]">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="classificacao"
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={(c: ClassificacaoProspeccao) => CLASSIFICACAO_LABELS[c]}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="classificacao" hideLabel />} />
              <Bar dataKey="value" radius={4}>
                {data.map((entry) => (
                  <Cell key={entry.classificacao} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProspeccaoClassificacaoPieChart;
