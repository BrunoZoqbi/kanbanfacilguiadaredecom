import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import ScriptsSetorList from '@/components/scripts/ScriptsSetorList';
import GerenciarScripts from '@/components/scripts/GerenciarScripts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SETOR_SCRIPT_LABELS } from '@/types/scripts';
import { Loader2, MessageSquareText, Settings } from 'lucide-react';

const Scripts: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();

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
            <MessageSquareText className="h-6 w-6" />
            Scripts
          </h1>
          <p className="text-muted-foreground">Scripts de atendimento prontos para usar</p>
        </div>

        <Tabs defaultValue="comercial">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="comercial">{SETOR_SCRIPT_LABELS.comercial}</TabsTrigger>
            <TabsTrigger value="financeiro">{SETOR_SCRIPT_LABELS.financeiro}</TabsTrigger>
            <TabsTrigger value="atendimento_geral">
              {SETOR_SCRIPT_LABELS.atendimento_geral}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="gerenciar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="comercial" className="mt-6">
            <ScriptsSetorList setor="comercial" />
          </TabsContent>
          <TabsContent value="financeiro" className="mt-6">
            <ScriptsSetorList setor="financeiro" />
          </TabsContent>
          <TabsContent value="atendimento_geral" className="mt-6">
            <ScriptsSetorList setor="atendimento_geral" />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="gerenciar" className="mt-6">
              <GerenciarScripts />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Scripts;
