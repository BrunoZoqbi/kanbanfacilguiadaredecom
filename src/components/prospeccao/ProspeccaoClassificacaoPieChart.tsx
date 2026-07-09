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
import { ClassificacaoProspeccao, CLASSIFICACAO_LABELS, CLASSIFICACAO_CHART_COLORS } from '@/types/prospeccao';
import { ProspeccaoStats } from '@/hooks/useProspeccaoStats';

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

// Usado tanto em ListaProspeccoes.tsx quanto na aba Prospecção do
// Dashboard consolidado — não duplica a conta nos dois lugares.
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

const ProspeccaoClassificacaoPieChart: React.FC<ProspeccaoClassificacaoPieChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Distribuição por Classificação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={CLASSIFICACAO_CHART_CONFIG} className="mx-auto aspect-square max-h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="classificacao" hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="classificacao" innerRadius={50} strokeWidth={2}>
              {data.map((entry) => (
                <Cell key={entry.classificacao} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="classificacao" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ProspeccaoClassificacaoPieChart;
