import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import { useItensSerializados } from '@/hooks/useItensSerializados';
import { useEstoqueSaldo } from '@/hooks/useEstoqueSaldo';
import { useProfiles } from '@/hooks/useProfiles';
import AppLayout from '@/components/layout/AppLayout';
import EstoqueVisaoGeral from '@/components/estoque/EstoqueVisaoGeral';
import EstoqueDisponivel from '@/components/estoque/EstoqueDisponivel';
import MeuEstoque from '@/components/estoque/MeuEstoque';
import EstoquePorTecnico from '@/components/estoque/EstoquePorTecnico';
import LancarRecolhimento from '@/components/estoque/LancarRecolhimento';
import CadastroProdutos from '@/components/estoque/CadastroProdutos';
import CadastroItemSerializado from '@/components/estoque/CadastroItemSerializado';
import GestaoCategorias from '@/components/estoque/GestaoCategorias';
import ItensEmAnalise from '@/components/estoque/ItensEmAnalise';
import EstoqueHistorico from '@/components/estoque/EstoqueHistorico';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Boxes, PackageCheck, Users, Package, ClipboardList, Wrench, FileSpreadsheet, LayoutDashboard, History } from 'lucide-react';
import { toast } from 'sonner';

const Estoque: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canManageStock = isAdmin || isGestorTecnico;
  const { itens, estoqueGeral } = useItensSerializados();
  const { data: saldos = [] } = useEstoqueSaldo(estoqueGeral?.id);
  const { data: profiles = [] } = useProfiles();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { generateEstoqueExcelReport } = await import('@/utils/exportReports');
      generateEstoqueExcelReport({ itens, saldos, profiles });
    } catch (error: any) {
      toast.error('Erro ao exportar relatório: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Boxes className="h-6 w-6" />
              Estoque
            </h1>
            <p className="text-muted-foreground">Controle de equipamentos e consumíveis</p>
          </div>
          {canManageStock && (
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar Relatório
            </Button>
          )}
        </div>

        <Tabs defaultValue={canManageStock ? 'visao-geral' : 'disponivel'}>
          <TabsList className="flex-wrap h-auto">
            {canManageStock && (
              <TabsTrigger value="visao-geral" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
            )}
            <TabsTrigger value="disponivel" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Disponível
            </TabsTrigger>
            <TabsTrigger value="meu-estoque" className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              Meu Estoque
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="por-tecnico" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Por Técnico
              </TabsTrigger>
            )}
            {canManageStock && (
              <TabsTrigger value="recolhimento" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Lançar Recolhimento
              </TabsTrigger>
            )}
            {canManageStock && (
              <TabsTrigger value="em-analise" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Em Análise
              </TabsTrigger>
            )}
            {canManageStock && (
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="cadastro" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cadastro
              </TabsTrigger>
            )}
          </TabsList>

          {canManageStock && (
            <TabsContent value="visao-geral" className="mt-6">
              <EstoqueVisaoGeral />
            </TabsContent>
          )}

          <TabsContent value="disponivel" className="mt-6">
            <EstoqueDisponivel />
          </TabsContent>

          <TabsContent value="meu-estoque" className="mt-6">
            <MeuEstoque />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="por-tecnico" className="mt-6">
              <EstoquePorTecnico />
            </TabsContent>
          )}

          {canManageStock && (
            <TabsContent value="recolhimento" className="mt-6">
              <LancarRecolhimento />
            </TabsContent>
          )}

          {canManageStock && (
            <TabsContent value="em-analise" className="mt-6">
              <ItensEmAnalise />
            </TabsContent>
          )}

          {canManageStock && (
            <TabsContent value="historico" className="mt-6">
              <EstoqueHistorico />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="cadastro" className="mt-6">
              <Tabs defaultValue="produtos">
                <TabsList>
                  <TabsTrigger value="produtos">Tipos de Produto</TabsTrigger>
                  <TabsTrigger value="itens">Novo Equipamento</TabsTrigger>
                  <TabsTrigger value="categorias">Categorias</TabsTrigger>
                </TabsList>
                <TabsContent value="produtos" className="mt-6">
                  <CadastroProdutos />
                </TabsContent>
                <TabsContent value="itens" className="mt-6">
                  <CadastroItemSerializado />
                </TabsContent>
                <TabsContent value="categorias" className="mt-6">
                  <GestaoCategorias />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Estoque;
