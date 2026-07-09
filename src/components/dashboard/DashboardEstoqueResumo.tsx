import React, { useMemo } from 'react';
import { useResumoEstoque } from '@/hooks/useResumoEstoque';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PackageCheck, UserCog, Wrench, Boxes } from 'lucide-react';
import EstoqueStatusPieChart, { buildEstoqueStatusChartData } from '@/components/estoque/EstoqueStatusPieChart';

// Resumo executivo compacto — o detalhamento por categoria/produto já
// existe na aba "Visão Geral" do próprio módulo Estoque (reaproveita a
// mesma RPC resumo_estoque_por_status()).
const DashboardEstoqueResumo: React.FC = () => {
  const { data, isLoading } = useResumoEstoque();
  const serializados = data?.serializados ?? [];

  const totals = useMemo(() => {
    return serializados.reduce(
      (acc, item) => {
        acc.disponivel += item.disponivel;
        acc.comTecnico += item.com_tecnico;
        acc.instalado += item.instalado_cliente;
        acc.ativos += item.disponivel + item.com_tecnico + item.instalado_cliente + item.analise_defeito;
        return acc;
      },
      { disponivel: 0, comTecnico: 0, instalado: 0, ativos: 0 }
    );
  }, [serializados]);

  const statusChartData = useMemo(() => buildEstoqueStatusChartData(serializados), [serializados]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Boxes className="h-4 w-4" />
              Total Ativos
            </div>
            <p className="text-2xl font-bold">{totals.ativos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <PackageCheck className="h-4 w-4 text-green-500" />
              Disponível
            </div>
            <p className="text-2xl font-bold">{totals.disponivel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <UserCog className="h-4 w-4 text-amber-500" />
              Com Técnico
            </div>
            <p className="text-2xl font-bold">{totals.comTecnico}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Wrench className="h-4 w-4 text-blue-500" />
              Instalado
            </div>
            <p className="text-2xl font-bold">{totals.instalado}</p>
          </CardContent>
        </Card>
      </div>

      <EstoqueStatusPieChart data={statusChartData} />
    </div>
  );
};

export default DashboardEstoqueResumo;
