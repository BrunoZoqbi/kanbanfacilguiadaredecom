import React, { useMemo } from 'react';
import { useProspeccoes } from '@/hooks/useProspeccoes';
import { useProspeccaoStats } from '@/hooks/useProspeccaoStats';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import ProspeccaoClassificacaoPieChart, {
  buildClassificacaoChartData,
} from '@/components/prospeccao/ProspeccaoClassificacaoPieChart';
import ProspeccaoSemanalBarChart, {
  buildProspeccoesPorSemana,
} from '@/components/prospeccao/ProspeccaoSemanalBarChart';

const DashboardProspeccaoResumo: React.FC = () => {
  const { stats, isLoading } = useProspeccaoStats();
  const { prospeccoes } = useProspeccoes();

  const classificacaoChartData = useMemo(() => buildClassificacaoChartData(stats), [stats]);
  const prospeccoesPorSemana = useMemo(() => buildProspeccoesPorSemana(prospeccoes), [prospeccoes]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Baixa
            </div>
            <p className="text-2xl font-bold">{stats.baixa}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Média
            </div>
            <p className="text-2xl font-bold">{stats.media}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Alta
            </div>
            <p className="text-2xl font-bold">{stats.alta}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conversão
            </div>
            <p className="text-2xl font-bold">{stats.taxaConversao}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProspeccaoClassificacaoPieChart data={classificacaoChartData} />
        <ProspeccaoSemanalBarChart data={prospeccoesPorSemana} />
      </div>
    </div>
  );
};

export default DashboardProspeccaoResumo;
