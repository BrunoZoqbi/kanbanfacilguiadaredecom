import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { HelpCircle, Loader2, Search } from 'lucide-react';

// Extrai o texto puro de um nó React (ex: o conteúdo JSX de uma seção),
// para permitir busca por texto sem precisar duplicar o conteúdo como
// string separada em cada seção.
const extrairTexto = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extrairTexto).join(' ');
  }
  if (React.isValidElement(node)) {
    return extrairTexto((node.props as { children?: React.ReactNode }).children);
  }
  return '';
};

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
  const [busca, setBusca] = useState('');

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

  const secoes: SecaoAjuda[] = [
    {
      id: 'tarefas',
      titulo: 'Tarefas (Kanban)',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Toque em <strong className="font-medium text-foreground">"Nova Tarefa"</strong> para
            criar — já é possível anexar PDF/foto e criar um checklist no momento da criação.
          </li>
          <li>
            Arraste o cartão entre as colunas "A Fazer", "Fazendo" e "Feito".
          </li>
          <li>
            Use os filtros (Responsável, Prioridade, Tipo, Prazo) para encontrar tarefas
            rapidamente.
          </li>
          <li>"Minhas Tarefas" mostra só o que está atribuído a você.</li>
          <li>
            O Calendário mostra as tarefas por data, com pontos coloridos indicando a prioridade.
          </li>
        </ul>
      ),
    },
    {
      id: 'estoque',
      titulo: 'Estoque',
      conteudo: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="font-medium text-foreground">Fluxo do equipamento:</strong>{' '}
            Disponível (na sede) → Retirado por um técnico → Instalado no cliente → Recolhido
            (vira tarefa automaticamente) → Devolvido à sede → Em Análise (se com defeito) →
            Reparado ou Baixa definitiva.
          </p>
          <div>
            <p className="font-medium text-foreground mb-1">Gestor Técnico</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cadastra produtos e itens na aba "Cadastro".</li>
              <li>
                Retira equipamento para técnico na aba "Disponível" (um selo "Estoque baixo"
                aparece quando restam 2 unidades ou menos).
              </li>
              <li>Lança recolhimento — já cria a tarefa e move o item automaticamente.</li>
              <li>Decide reparo ou baixa na aba "Em Análise".</li>
              <li>
                O botão <strong className="font-medium text-foreground">"Exportar Relatório"</strong>{' '}
                gera uma planilha Excel completa.
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Técnico</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Acompanha os equipamentos com você em "Meu Estoque".</li>
              <li>Use "Instalar/Usar" ao instalar em um cliente.</li>
              <li>Use "Devolver na Sede" ao devolver.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'prospeccao',
      titulo: 'Prospecção Comercial',
      // Só quem tem acesso ao módulo (mesma regra do menu em AppLayout).
      visivelPara: () => isAdmin || isGestorComercial,
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Toque em <strong className="font-medium text-foreground">"Nova Prospecção"</strong> e
            preencha os dados do contato (visita ou ligação).
          </li>
          <li>
            Responda o checklist de 7 perguntas — pontuação e classificação (Baixa/Média/Alta) são
            calculadas automaticamente.
          </li>
          <li>
            Prospecções "Alta" geram uma tarefa automaticamente no Kanban, com prazo de 2 dias,
            para você não perder o timing de contato.
          </li>
          <li>
            Acompanhe o status (Novo, Em negociação, Convertido, Perdido) na lista.
          </li>
        </ul>
      ),
    },
    {
      id: 'tickets',
      titulo: 'Tickets',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Toque em <strong className="font-medium text-foreground">"Novo Ticket"</strong> para
            registrar um chamado de suporte.
          </li>
          <li>
            Use a aba "Respostas" para se comunicar com o cliente (ele acompanha essas mensagens
            pelo Portal Público).
          </li>
          <li>
            Use "Notas Internas" para anotações que só a equipe vê — o cliente nunca acessa essa
            aba.
          </li>
          <li>Ao resolver, toque em "Marcar como Resolvido".</li>
          <li>
            O cliente consulta seu próprio chamado, sem login, em{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/consulta-ticket</code>,
            informando o número do ticket e o CPF ou telefone cadastrado.
          </li>
        </ul>
      ),
    },
    {
      id: 'scripts',
      titulo: 'Scripts de Atendimento',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Textos prontos para copiar e colar no WhatsApp, organizados em 3 abas por setor:
            Comercial, Financeiro e Atendimento Geral.
          </li>
          <li>Dentro de cada aba, os scripts são agrupados por categoria (ex: Entrada, Objeção, Cobrança).</li>
          <li>
            Use o campo de busca para encontrar um script pelo título ou conteúdo, e o botão{' '}
            <strong className="font-medium text-foreground">"Copiar"</strong> para colar direto na
            conversa.
          </li>
          <li>
            Admin edita, cria, ativa/desativa e reordena os scripts na aba{' '}
            <strong className="font-medium text-foreground">"Gerenciar"</strong>.
          </li>
        </ul>
      ),
    },
    {
      id: 'perfil',
      titulo: 'Meu Perfil',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>Edite seu nome completo e WhatsApp a qualquer momento.</li>
          <li>
            Para trocar a senha, informe a senha atual e a nova senha — por segurança, e-mail e
            papel não podem ser alterados por aqui (fale com o administrador).
          </li>
        </ul>
      ),
    },
    {
      id: 'papeis',
      titulo: 'Papéis e Permissões',
      // Usuário comum não precisa do detalhe administrativo de papéis; quem
      // tem alguma função de gestão (admin, gestor técnico ou comercial) vê.
      visivelPara: () => role !== 'user',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-foreground">Admin:</strong> acesso total a todos
            os módulos e usuários.
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Técnico:</strong> gerencia o
            Estoque (retirada, recolhimento), vê as tarefas da equipe técnica e tem visão ampla de
            todos os Tickets — na prática, responde principalmente pelos chamados técnicos
            (suporte, conexão, instalação).
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Comercial:</strong> gerencia
            Prospecção Comercial e também tem visão ampla de todos os Tickets — na prática,
            responde principalmente pelos chamados comerciais e financeiros (cobrança,
            negociação, cancelamento).
          </li>
          <li>
            <strong className="font-medium text-foreground">Usuário comum:</strong> vê e cria
            apenas as próprias tarefas, e usa Estoque/Tickets apenas nos itens atribuídos a si.
          </li>
          <li>
            O admin pode editar o e-mail e redefinir a senha de qualquer usuário diretamente pela
            tela Editar, dentro de Gerenciar &gt; Usuários.
          </li>
        </ul>
      ),
    },
  ];

  const secoesVisiveis = secoes.filter((secao) => !secao.visivelPara || secao.visivelPara());

  const termoBusca = busca.trim().toLowerCase();
  const secoesFiltradas = termoBusca
    ? secoesVisiveis.filter((secao) =>
        `${secao.titulo} ${extrairTexto(secao.conteudo)}`.toLowerCase().includes(termoBusca)
      )
    : secoesVisiveis;

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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            {secoesFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum resultado encontrado.
              </p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {secoesFiltradas.map((secao) => (
                  <AccordionItem key={secao.id} value={secao.id}>
                    <AccordionTrigger>{secao.titulo}</AccordionTrigger>
                    <AccordionContent>{secao.conteudo}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Ajuda;
