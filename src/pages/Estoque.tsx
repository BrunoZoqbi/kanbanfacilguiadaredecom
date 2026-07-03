import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorTecnico } from '@/hooks/useIsGestorTecnico';
import AppLayout from '@/components/layout/AppLayout';
import EstoqueDisponivel from '@/components/estoque/EstoqueDisponivel';
import MeuEstoque from '@/components/estoque/MeuEstoque';
import EstoquePorTecnico from '@/components/estoque/EstoquePorTecnico';
import LancarRecolhimento from '@/components/estoque/LancarRecolhimento';
import CadastroProdutos from '@/components/estoque/CadastroProdutos';
import CadastroItemSerializado from '@/components/estoque/CadastroItemSerializado';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Boxes, PackageCheck, Users, Package, ClipboardList } from 'lucide-react';

const Estoque: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const isGestorTecnico = useIsGestorTecnico();
  const canManageStock = isAdmin || isGestorTecnico;

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
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Boxes className="h-6 w-6" />
            Estoque
          </h1>
          <p className="text-muted-foreground">Controle de equipamentos e consumíveis</p>
        </div>

        <Tabs defaultValue="disponivel">
          <TabsList className="flex-wrap h-auto">
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
            {isAdmin && (
              <TabsTrigger value="cadastro" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Cadastro de Produtos
              </TabsTrigger>
            )}
          </TabsList>

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

          {isAdmin && (
            <TabsContent value="cadastro" className="mt-6">
              <Tabs defaultValue="produtos">
                <TabsList>
                  <TabsTrigger value="produtos">Produtos</TabsTrigger>
                  <TabsTrigger value="itens">Itens Serializados</TabsTrigger>
                </TabsList>
                <TabsContent value="produtos" className="mt-6">
                  <CadastroProdutos />
                </TabsContent>
                <TabsContent value="itens" className="mt-6">
                  <CadastroItemSerializado />
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
