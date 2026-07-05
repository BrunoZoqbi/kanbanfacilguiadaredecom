import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsGestorComercial } from '@/hooks/useIsGestorComercial';
import AppLayout from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Loader2 } from 'lucide-react';

// Data da última edição do conteúdo abaixo (não é gerada automaticamente).
// Atualize esta constante manualmente sempre que o texto de alguma seção mudar.
const ULTIMA_ATUALIZACAO = '05/07/2026';

interface SecaoAjuda {
  id: string;
  titulo: string;
  // Módulo visível na navegação para todos os papéis, exceto quando
  // `visivelPara` restringe a seção a papéis específicos (ex: Prospecção
  // Comercial só existe para quem tem acesso ao módulo).
  visivelPara?: () => boolean;
  conteudo: React.ReactNode;
}

const Ajuda: React.FC = () => {
  const { user, isAdmin, role, isLoading } = useAuth();
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

  // TODO: substituir os textos de placeholder abaixo pelo conteúdo final de
  // cada módulo (será enviado em seguida).
  const secoes: SecaoAjuda[] = [
    {
      id: 'tarefas',
      titulo: 'Tarefas (Kanban)',
      conteudo: (
        <p className="text-sm text-muted-foreground">
          [Placeholder] Conteúdo de uso rápido do módulo de Tarefas (Kanban) — quadro, anexos,
          checklist, comentários, tags e tipos de tarefa.
        </p>
      ),
    },
    {
      id: 'estoque',
      titulo: 'Estoque',
      conteudo: (
        <p className="text-sm text-muted-foreground">
          [Placeholder] Conteúdo de uso rápido do módulo de Estoque — itens serializados, saldo
          de consumíveis, retirada, instalação, recolhimento e devolução.
        </p>
      ),
    },
    {
      id: 'prospeccao',
      titulo: 'Prospecção Comercial',
      // Só quem tem acesso ao módulo (mesma regra do menu em AppLayout).
      visivelPara: () => isAdmin || isGestorComercial,
      conteudo: (
        <p className="text-sm text-muted-foreground">
          [Placeholder] Conteúdo de uso rápido do módulo de Prospecção Comercial — cadastro de
          leads, checklist de pontuação e classificação automática.
        </p>
      ),
    },
    {
      id: 'tickets',
      titulo: 'Tickets',
      conteudo: (
        <p className="text-sm text-muted-foreground">
          [Placeholder] Conteúdo de uso rápido do módulo de Tickets — respostas ao cliente, notas
          internas e portal público de consulta.
        </p>
      ),
    },
    {
      id: 'papeis',
      titulo: 'Papéis e Permissões',
      // Usuário comum não precisa do detalhe administrativo de papéis; quem
      // tem alguma função de gestão (admin, gestor técnico ou comercial) vê.
      visivelPara: () => role !== 'user',
      conteudo: (
        <p className="text-sm text-muted-foreground">
          [Placeholder] Conteúdo de uso rápido sobre papéis e permissões — o que cada papel
          (Admin, Gestor Técnico, Gestor Comercial, Usuário) pode ver e fazer no sistema.
        </p>
      ),
    },
  ];

  const secoesVisiveis = secoes.filter((secao) => !secao.visivelPara || secao.visivelPara());

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <HelpCircle className="h-6 w-6" />
            Ajuda
          </h1>
          <p className="text-muted-foreground">Guia rápido de uso dos módulos do Kanban Fácil</p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {ULTIMA_ATUALIZACAO}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {secoesVisiveis.map((secao) => (
                <AccordionItem key={secao.id} value={secao.id}>
                  <AccordionTrigger>{secao.titulo}</AccordionTrigger>
                  <AccordionContent>{secao.conteudo}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Ajuda;
