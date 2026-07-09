import React from 'react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { Prospeccao } from '@/types/prospeccao';

const SEMANAL_CHART_CONFIG: ChartConfig = {
  quantidade: { label: 'Prospecções', color: 'hsl(var(--primary))' },
};

export interface ProspeccaoSemanalDatum {
  semana: string;
  quantidade: number;
}

// Últimas 8 semanas (segunda a domingo) — calculado a partir da lista já
// carregada no cliente (useProspeccoes não pagina), sem precisar de RPC
// nova. Usado tanto em ListaProspeccoes.tsx quanto na aba Prospecção do
// Dashboard consolidado.
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Prospecções por Semana (últimas 8 semanas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={SEMANAL_CHART_CONFIG} className="w-full max-h-[240px]">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ProspeccaoSemanalBarChart;
