import React, { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import { Prospeccao } from '@/types/prospeccao';

const PREF_KEY = 'chart_pref_prospeccao_semanal';

const SEMANAL_CHART_CONFIG: ChartConfig = {
  quantidade: { label: 'Prospecções', color: 'hsl(var(--primary))' },
};

const WEEK_COLORS = Array.from(
  { length: 8 },
  (_, i) => `hsl(var(--chart-${(i % 5) + 1}))`
);

export interface ProspeccaoSemanalDatum {
  semana: string;
  quantidade: number;
}

export const buildProspeccoesPorSemana = (prospeccoes: Prospeccao[]): ProspeccaoSemanalDatum[] => {
  const hoje = new Date();
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const inicio = startOfWeek(subWeeks(hoje, 7 - i), { weekStartsOn: 1 });
    const fim = endOfWeek(inicio, { weekStartsOn: 1 });
    return { inicio, fim, semana: format(inicio, 'dd/MM', { locale: ptBR }) };
  });

  return semanas.map(({ inicio, fim, semana }) => ({
    semana,
    quantidade: prospeccoes.filter((p) => {
      const criadaEm = new Date(p.created_at);
      return criadaEm >= inicio && criadaEm <= fim;
    }).length,
  }));
};

interface ProspeccaoSemanalBarChartProps {
  data: ProspeccaoSemanalDatum[];
}

const ProspeccaoSemanalBarChart: React.FC<ProspeccaoSemanalBarChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>(() => {
    return (localStorage.getItem(PREF_KEY) as 'bar' | 'pie') || 'bar';
  });

  const handleChartTypeChange = (type: 'bar' | 'pie') => {
    setChartType(type);
    localStorage.setItem(PREF_KEY, type);
  };

  const pieData = useMemo(() => data.filter((d) => d.quantidade > 0), [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base flex items-center gap-2 flex-1">
            <BarChart2 className="h-4 w-4" />
            Prospecções por Semana (últimas 8 semanas)
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
          <ChartContainer config={SEMANAL_CHART_CONFIG} className="w-full max-h-[240px]">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={SEMANAL_CHART_CONFIG} className="mx-auto aspect-square max-h-[240px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="semana" />} />
              <Pie data={pieData} dataKey="quantidade" nameKey="semana" innerRadius={50} strokeWidth={2}>
                {pieData.map((entry, i) => (
                  <Cell key={entry.semana} fill={WEEK_COLORS[i % WEEK_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProspeccaoSemanalBarChart;
