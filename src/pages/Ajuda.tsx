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
const ULTIMA_ATUALIZACAO = '23/07/2026';

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
            <strong className="font-medium text-foreground">Anexo de PDF:</strong> ao anexar um
            PDF, o texto é extraído automaticamente e inserido na descrição da tarefa — o arquivo
            em si não é armazenado. Se o PDF não tiver texto extraível (ex: escaneado), o sistema
            oferece anexar o arquivo normalmente.
          </li>
          <li>
            <strong className="font-medium text-foreground">Trocar responsável:</strong> Admin e
            Gestor Técnico podem alterar o responsável de uma tarefa já criada, no painel de
            edição — o novo responsável recebe uma notificação automática.
          </li>
          <li>
            <strong className="font-medium text-foreground">Rascunho automático:</strong> se o
            formulário for fechado ou a página recarregar antes de salvar, os dados já digitados são
            recuperados automaticamente ao reabrir.
          </li>
          <li>
            Arraste o cartão entre as colunas{' '}
            <strong className="font-medium text-foreground">"A Fazer"</strong>,{' '}
            <strong className="font-medium text-foreground">"Fazendo"</strong> e{' '}
            <strong className="font-medium text-foreground">"Feito"</strong>.
          </li>
          <li>
            A coluna <strong className="font-medium text-foreground">"Feito"</strong> usa
            paginação — clique em{' '}
            <strong className="font-medium text-foreground">"Carregar mais"</strong> para ver
            tarefas mais antigas sem travar o carregamento inicial.
          </li>
          <li>
            Use os filtros (Responsável, Prioridade, Tipo, Prazo) para encontrar tarefas
            rapidamente.
          </li>
          <li>
            <strong className="font-medium text-foreground">"Minhas Tarefas"</strong> mostra só o
            que está atribuído a você, com busca e paginação para históricos longos.
          </li>
          <li>
            O Calendário mostra as tarefas por data, com pontos coloridos indicando a prioridade.
          </li>
          <li>
            <strong className="font-medium text-foreground">Tarefas Recorrentes:</strong> ao criar
            uma tarefa, expanda a seção{' '}
            <strong className="font-medium text-foreground">"Recorrência"</strong> para configurar
            repetição (Diária, Semanal ou Mensal). Defina o intervalo, os dias da semana (para
            semanal), o horário e quando termina (nunca, em uma data, ou após N ocorrências). O
            sistema cria automaticamente as primeiras 4 instâncias. Para gerar mais, abra o{' '}
            <strong className="font-medium text-foreground">template</strong> no Kanban e use o
            botão{' '}
            <strong className="font-medium text-foreground">"Gerar mais instâncias"</strong>{' '}
            (visível para Admin e Gestores). Tarefas instância exibem o badge{' '}
            <strong className="font-medium text-foreground">"Recorrente"</strong> e um link para o
            template original.
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
            <strong className="font-medium text-foreground">
              Fluxo do equipamento (item serializado):
            </strong>{' '}
            Disponível (na sede) → Retirado por um técnico → Instalado no cliente → Recolhido
            (vira tarefa automaticamente) → Devolvido à sede → Em Análise (se com defeito) →
            Reparado ou Baixa definitiva.
          </p>
          <p>
            <strong className="font-medium text-foreground">Fluxo do consumível</strong> (cabo,
            conector e outros itens sem número de série):{' '}
            <strong className="font-medium text-foreground">Entrada na sede</strong> →{' '}
            <strong className="font-medium text-foreground">Retirar para Técnico</strong> (vai para
            o saldo do técnico) →{' '}
            <strong className="font-medium text-foreground">Usar/Consumir em campo</strong> (desconta
            do saldo do técnico) →{' '}
            <strong className="font-medium text-foreground">Devolver à Sede</strong> o que sobrar.
            A custódia é rastreada por quantidade, não por unidade individual.
          </p>
          <div>
            <p className="font-medium text-foreground mb-1">Gestor Técnico / Admin</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cadastra produtos e itens na aba "Cadastro".</li>
              <li>
                Na aba <strong className="font-medium text-foreground">"Disponível"</strong>, retira
                equipamento ou consumível para um técnico. O campo de busca encontra itens por
                série, patrimônio, MAC ou nome do cliente vinculado. Um selo{' '}
                <strong className="font-medium text-foreground">"Estoque baixo"</strong> aparece
                quando o saldo disponível fica igual ou abaixo do limite configurado em Gerenciar
                &gt; Configurações.
              </li>
              <li>
                Lança recolhimento na aba{' '}
                <strong className="font-medium text-foreground">"Lançar Recolhimento"</strong> (com
                busca e paginação nos itens instalados em cliente) — já cria a tarefa e move o item
                automaticamente.
              </li>
              <li>Decide reparo ou baixa na aba "Em Análise".</li>
              <li>
                A aba{' '}
                <strong className="font-medium text-foreground">"Visão Geral"</strong> (só Admin e
                Gestor Técnico) exibe o resumo quantitativo de todo o estoque por status, categoria
                e produto — com gráfico alternável entre pizza e barras (o toggle fica no canto
                superior direito de cada gráfico e a preferência é salva automaticamente).
              </li>
              <li>
                A aba{' '}
                <strong className="font-medium text-foreground">"Por Técnico"</strong> mostra uma
                lista expansível: clique no nome do técnico para ver o que ele tem em posse —
                serializados e consumíveis aparecem em seções separadas. Técnicos sem nenhum item
                ficam ocultos.
              </li>
              <li>
                O botão{' '}
                <strong className="font-medium text-foreground">"Exportar Relatório"</strong> gera
                uma planilha Excel completa.
              </li>
              <li>
                A aba{' '}
                <strong className="font-medium text-foreground">
                  "Histórico de Movimentações"
                </strong>{' '}
                (só Admin e Gestor Técnico) lista todas as entradas, saídas, retiradas, devoluções
                e baixas registradas no Estoque, mais recentes primeiro. Busque por produto,
                número de série, técnico ou observação, filtre por tipo de movimento, e use
                "Carregar mais" para navegar em históricos longos (lotes de 30).
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Técnico</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Acompanha os equipamentos com você em "Meu Estoque".</li>
              <li>Use "Instalar/Usar" ao instalar um equipamento em um cliente.</li>
              <li>Use "Devolver na Sede" ao devolver um equipamento.</li>
              <li>
                A seção "Consumíveis Comigo" lista o que você retirou — use "Usar/Consumir" ao
                aplicar em campo, ou "Devolver à Sede" o que não usar.
              </li>
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
            Toque em{' '}
            <strong className="font-medium text-foreground">"Nova Prospecção"</strong> e preencha
            os dados do contato (visita ou ligação).
          </li>
          <li>
            Responda o checklist de 7 perguntas — pontuação e classificação (Baixa/Média/Alta) são
            calculadas automaticamente.
          </li>
          <li>
            Prospecções "Alta" geram uma tarefa automaticamente no Kanban, com prazo de 2 dias,
            para não perder o timing de contato.
          </li>
          <li>
            Acompanhe o status (Novo, Em negociação, Convertido, Perdido) na lista. Use o campo de
            busca e a paginação para navegar em históricos longos.
          </li>
          <li>
            Clique numa prospecção já cadastrada para reabri-la: consulte as respostas do checklist
            com a pontuação individual de cada pergunta (somente leitura — o checklist em si não
            pode ser refeito, para não recalcular a pontuação) e edite os dados de contato e o
            status.
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
            registrar um chamado de suporte. Use a busca e a paginação para navegar em históricos
            longos.
          </li>
          <li>
            <strong className="font-medium text-foreground">Módulo compartilhado:</strong> Gestor
            Técnico trata chamados técnicos (suporte, conexão, instalação); Gestor Comercial trata
            chamados comerciais e financeiros (cobrança, negociação, cancelamento). Ambos têm visão
            ampla de todos os tickets.
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
            O cliente consulta o próprio chamado, sem login, em{' '}
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
          <li>
            Dentro de cada aba, os scripts são agrupados por categoria (ex: Entrada, Objeção,
            Cobrança).
          </li>
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
      id: 'notificacoes',
      titulo: 'Notificações',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            O sino na barra lateral mostra um selo com a quantidade de notificações não lidas,
            atualizado em tempo real (sem precisar recarregar a página). Toque nele para ir até{' '}
            <strong className="font-medium text-foreground">"Notificações"</strong>.
          </li>
          <li>
            A página <strong className="font-medium text-foreground">"Notificações"</strong> lista
            o histórico completo, mais recentes primeiro, com paginação. Toque numa notificação
            para marcá-la como lida e abrir o que ela se refere; use{' '}
            <strong className="font-medium text-foreground">"Marcar todas como lidas"</strong> para
            limpar tudo de uma vez.
          </li>
          <li>
            Você recebe uma notificação automaticamente quando: uma tarefa é atribuída a você, o
            ticket que você abriu recebe uma resposta, ou (Admin/Gestor Técnico) o estoque de um
            produto fica baixo.
          </li>
        </ul>
      ),
    },
    {
      id: 'calendario',
      titulo: 'Calendário',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Visualize tarefas organizadas por data. Pontos coloridos nos dias indicam a prioridade
            de cada tarefa (verde = baixa, amarelo = média, laranja = alta, vermelho = crítica).
          </li>
          <li>
            <strong className="font-medium text-foreground">Admin e Gestor Técnico:</strong> um
            filtro <strong className="font-medium text-foreground">"Responsável"</strong> aparece no
            topo do calendário — selecione qualquer pessoa para ver só as tarefas dela, ou deixe em
            branco para ver todas.
          </li>
          <li>
            <strong className="font-medium text-foreground">
              Gestor Comercial e Usuário comum:
            </strong>{' '}
            o calendário mostra apenas as próprias tarefas, sem opção de ver tarefas de outras
            pessoas.
          </li>
          <li>
            Clique em um dia para listar as tarefas daquela data no painel lateral. Toque numa
            tarefa para abrir o detalhe completo.
          </li>
          <li>
            Dias com tarefas atrasadas (ainda não concluídas) exibem um ponto vermelho piscando no
            canto superior direito da célula.
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
            papel não podem ser alterados por aqui.
          </li>
          <li>
            Se precisar alterar o e-mail ou ter a senha redefinida por outra pessoa, solicite ao
            Admin — que pode fazer isso em{' '}
            <strong className="font-medium text-foreground">
              Gerenciar &gt; Usuários &gt; Editar
            </strong>
            .
          </li>
        </ul>
      ),
    },
    {
      id: 'dashboard',
      titulo: 'Dashboard (Admin)',
      visivelPara: () => isAdmin,
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Painel consolidado com abas para Tarefas, Estoque, Prospecção e Tickets — resumo
            executivo de cada módulo sem precisar entrar em cada tela separadamente.
          </li>
          <li>
            A aba "Tarefas" mantém o detalhamento completo (ranking por usuário, taxa de conclusão
            no prazo, exportação em PDF/Excel).
          </li>
          <li>
            As abas Estoque, Prospecção e Tickets exibem gráficos visuais — alterne entre pizza e
            barras usando o toggle no canto superior direito de cada gráfico. A preferência é salva
            automaticamente por gráfico e persiste ao navegar entre páginas.
          </li>
        </ul>
      ),
    },
    {
      id: 'gerenciar',
      titulo: 'Gerenciar (Admin)',
      visivelPara: () => isAdmin,
      conteudo: (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Usuários</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Busca por nome, e-mail ou WhatsApp + filtro por papel + paginação para navegar em
                equipes grandes.
              </li>
              <li>
                Ação "Editar": permite alterar o e-mail e redefinir a senha de qualquer usuário
                diretamente pelo painel Admin, sem precisar que a pessoa faça isso por conta
                própria.
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Reatribuir em Massa</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Busca + paginação para encontrar tarefas. O botão{' '}
                <strong className="font-medium text-foreground">"Selecionar todos"</strong>{' '}
                seleciona apenas os itens visíveis na página atual — carregue mais itens antes de
                selecionar se precisar de um conjunto maior.
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Logs</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Histórico de ações do sistema com paginação em lotes de 30 entradas. Use a busca
                para filtrar por ação ou usuário.
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Configurações</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Define o{' '}
                <strong className="font-medium text-foreground">
                  limite numérico de "Estoque baixo"
                </strong>
                : quando o saldo disponível de um produto (serializado ou consumível) fica igual ou
                abaixo desse valor, o selo de alerta aparece na aba "Disponível" do Estoque. O
                valor padrão é 2, mas pode ser ajustado a qualquer momento.
              </li>
            </ul>
          </div>
        </div>
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
            <strong className="font-medium text-foreground">Admin:</strong> acesso total a todos os
            módulos e usuários. Também define o limite de alerta de estoque baixo em Gerenciar &gt;
            Configurações, edita e-mails e redefine senhas de outros usuários em Gerenciar &gt;
            Usuários.
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Técnico:</strong> gerencia o
            Estoque (retirada, recolhimento, baixa) e o Histórico de Movimentações, tem visão
            ampla de todos os Tickets — na prática, responde principalmente pelos chamados técnicos
            (suporte, conexão, instalação) — e gerencia as tarefas da equipe técnica: pode editar
            título, descrição, prioridade, checklist, anexos, tags e responsável de qualquer
            tarefa da equipe, exceto tarefas atribuídas a um Admin.
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Comercial:</strong> gerencia
            Prospecção Comercial e também tem visão ampla de todos os Tickets — na prática,
            responde principalmente pelos chamados comerciais e financeiros (cobrança, negociação,
            cancelamento).
          </li>
          <li>
            <strong className="font-medium text-foreground">Usuário comum:</strong> vê e cria
            apenas as próprias tarefas; no Estoque e Tickets, só acessa os itens atribuídos a si;
            no Calendário, vê apenas as próprias tarefas.
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
