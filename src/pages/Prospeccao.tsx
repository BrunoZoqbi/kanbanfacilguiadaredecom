import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorComercial } from '@/hooks/useIsGestorComercial';
import AppLayout from '@/components/layout/AppLayout';
import CadastroProspeccao from '@/components/prospeccao/CadastroProspeccao';
import ListaProspeccoes from '@/components/prospeccao/ListaProspeccoes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, UserPlus, ListChecks } from 'lucide-react';

const Prospeccao: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const isGestorComercial = useIsGestorComercial();

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

  if (!isAdmin && !isGestorComercial) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Target className="h-6 w-6" />
            Prospecção Comercial
          </h1>
          <p className="text-muted-foreground">Captação e qualificação de leads</p>
        </div>

        <Tabs defaultValue="prospeccoes">
          <TabsList>
            <TabsTrigger value="prospeccoes" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              {isAdmin ? 'Todas as Prospecções' : 'Minhas Prospecções'}
            </TabsTrigger>
            <TabsTrigger value="nova" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Nova Prospecção
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prospeccoes" className="mt-6">
            <ListaProspeccoes />
          </TabsContent>

          <TabsContent value="nova" className="mt-6">
            <CadastroProspeccao />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Prospeccao;
