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

// Extrai o texto puro de um nó React para permitir busca por texto sem
// precisar duplicar o conteúdo como string separada em cada seção.
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

// Atualize esta constante manualmente sempre que o texto de alguma seção mudar.
const ULTIMA_ATUALIZACAO = '24/07/2026';

interface SecaoAjuda {
  id: string;
  titulo: string;
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
      id: 'notificacoes',
      titulo: 'Notificações',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            O sino na barra lateral exibe um badge com a quantidade de notificações não lidas,
            atualizado em tempo real via Realtime — sem precisar recarregar a página.
          </li>
          <li>
            A página <strong className="font-medium text-foreground">"Notificações"</strong> lista
            o histórico completo, mais recentes primeiro, com paginação. Toque numa notificação
            para marcá-la como lida e abrir o que ela se refere; use{' '}
            <strong className="font-medium text-foreground">"Marcar todas como lidas"</strong> para
            limpar tudo de uma vez.
          </li>
          <li>
            Disparos automáticos: uma tarefa foi atribuída a você; o ticket que você abriu recebeu
            uma resposta; (Admin / Gestor Técnico) o estoque de um produto ficou baixo.
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
            Exclusivo para Admin. Painel consolidado com 5 abas:{' '}
            <strong className="font-medium text-foreground">Tarefas</strong>,{' '}
            <strong className="font-medium text-foreground">Reagendamentos</strong>,{' '}
            <strong className="font-medium text-foreground">Estoque</strong>,{' '}
            <strong className="font-medium text-foreground">Prospecção</strong> e{' '}
            <strong className="font-medium text-foreground">Tickets</strong> — resumo executivo de
            cada módulo sem precisar entrar em cada tela separadamente.
          </li>
          <li>
            A aba <strong className="font-medium text-foreground">"Tarefas"</strong> exibe ranking
            por usuário e taxa de conclusão no prazo, com exportação em{' '}
            <strong className="font-medium text-foreground">PDF</strong> e{' '}
            <strong className="font-medium text-foreground">Excel</strong>.
          </li>
          <li>
            A aba <strong className="font-medium text-foreground">"Reagendamentos"</strong> mede o
            cumprimento de prazo: cards com o total de tarefas cumpridas no prazo, reagendadas e
            atrasadas (com percentuais), um gráfico de distribuição por motivo de reagendamento e
            uma tabela de desempenho por usuário — ordenada pela taxa de cumprimento, pior
            desempenho primeiro, com linha expansível mostrando as tarefas reagendadas de cada
            pessoa. Filtro de período (30/60/90 dias ou personalizado) no topo da aba.
          </li>
          <li>
            Todas as abas têm gráficos completos — alterne entre pizza e barras usando o toggle no
            canto superior direito de cada gráfico. A preferência é salva automaticamente e persiste
            entre navegações.
          </li>
        </ul>
      ),
    },
    {
      id: 'minhas-tarefas',
      titulo: 'Minhas Tarefas',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Lista exclusiva das tarefas atribuídas a você, separadas em abas:{' '}
            <strong className="font-medium text-foreground">Todas</strong>,{' '}
            <strong className="font-medium text-foreground">A Fazer</strong>,{' '}
            <strong className="font-medium text-foreground">Fazendo</strong> e{' '}
            <strong className="font-medium text-foreground">Feitas</strong>.
          </li>
          <li>
            Cada aba usa paginação por cursor — clique em{' '}
            <strong className="font-medium text-foreground">"Carregar mais"</strong> para navegar em
            históricos longos sem travar o carregamento inicial.
          </li>
          <li>
            Tarefas com prazo vencido exibem o badge{' '}
            <strong className="font-medium text-foreground">"Atrasada"</strong> em destaque. Toque
            em qualquer cartão para abrir o detalhe completo.
          </li>
        </ul>
      ),
    },
    {
      id: 'kanban',
      titulo: 'Kanban',
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
            <strong className="font-medium text-foreground">Reagendamento:</strong> ao alterar o
            prazo de uma tarefa já criada, o sistema pede obrigatoriamente o motivo do
            reagendamento (Pedido do Técnico, Pedido do Cliente, Condição Externa ou Outro), com um
            campo de observação opcional. Essas informações alimentam a aba "Reagendamentos" do
            Dashboard.
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
            A coluna <strong className="font-medium text-foreground">"Feito"</strong> usa paginação
            — clique em{' '}
            <strong className="font-medium text-foreground">"Carregar mais"</strong> para ver
            tarefas mais antigas sem travar o carregamento inicial.
          </li>
          <li>
            Use os filtros (Responsável, Prioridade, Tipo, Prazo) para encontrar tarefas
            rapidamente.
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
      id: 'prospeccao',
      titulo: 'Prospecção Comercial',
      visivelPara: () => isAdmin || isGestorComercial,
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Módulo exclusivo para{' '}
            <strong className="font-medium text-foreground">Admin</strong> e{' '}
            <strong className="font-medium text-foreground">Gestor Comercial</strong>. Use a busca
            e a paginação para navegar em históricos longos.
          </li>
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
            Prospecções{' '}
            <strong className="font-medium text-foreground">"Alta"</strong> geram uma tarefa
            automaticamente no Kanban, com prazo de 2 dias, para não perder o timing de contato.
          </li>
          <li>
            Acompanhe o status (Novo, Em negociação, Convertido, Perdido) na lista.
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
      id: 'scripts',
      titulo: 'Scripts de Atendimento',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Textos prontos para copiar e colar no WhatsApp, organizados em 4 abas por setor:{' '}
            <strong className="font-medium text-foreground">Comercial</strong>,{' '}
            <strong className="font-medium text-foreground">Financeiro</strong>,{' '}
            <strong className="font-medium text-foreground">Atendimento Geral</strong> e{' '}
            <strong className="font-medium text-foreground">Suporte Técnico</strong>. O setor
            Suporte Técnico agrupa as categorias Triagem Remota, Comunicados, Em Campo e
            Escalonamento.
          </li>
          <li>
            Dentro de cada aba, os scripts são agrupados por categoria (ex: Entrada, Objeção,
            Cobrança, Triagem Remota).
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
            <strong className="font-medium text-foreground">Visibilidade:</strong>{' '}
            <strong className="font-medium text-foreground">Admin</strong>,{' '}
            <strong className="font-medium text-foreground">Gestor Técnico</strong> e{' '}
            <strong className="font-medium text-foreground">Gestor Comercial</strong> veem todos os
            tickets.{' '}
            <strong className="font-medium text-foreground">Usuário comum</strong> vê apenas os
            tickets atribuídos a si.
          </li>
          <li>
            <strong className="font-medium text-foreground">Módulo compartilhado:</strong> Gestor
            Técnico responde principalmente pelos chamados técnicos (suporte, conexão, instalação);
            Gestor Comercial pelos chamados comerciais e financeiros (cobrança, negociação,
            cancelamento). Ambos têm visão ampla de todos os tickets.
          </li>
          <li>
            Use a aba <strong className="font-medium text-foreground">"Respostas"</strong> para se
            comunicar com o cliente (ele acompanha essas mensagens pelo Portal Público).
          </li>
          <li>
            Use <strong className="font-medium text-foreground">"Notas Internas"</strong> para
            anotações que só a equipe vê — o cliente nunca acessa essa aba.
          </li>
          <li>
            Ao resolver, toque em{' '}
            <strong className="font-medium text-foreground">"Marcar como Resolvido"</strong>.
          </li>
          <li>
            O cliente consulta o próprio chamado, sem login, em{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">/consulta-ticket</code>,
            informando o número do ticket e o CPF ou telefone cadastrado.
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
            <strong className="font-medium text-foreground">Usar/Consumir em campo</strong>{' '}
            (desconta do saldo do técnico) →{' '}
            <strong className="font-medium text-foreground">Devolver à Sede</strong> o que sobrar.
            A custódia é rastreada por quantidade, não por unidade individual.
          </p>
          <div>
            <p className="font-medium text-foreground mb-1">Abas disponíveis</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="font-medium text-foreground">Visão Geral</strong> (Admin e
                Gestor Técnico): resumo quantitativo de todo o estoque por status, categoria e
                produto. Gráficos alternáveis entre pizza e barras — o toggle fica no canto
                superior direito de cada gráfico e a preferência é salva automaticamente.
              </li>
              <li>
                <strong className="font-medium text-foreground">Disponível</strong> (todos os
                papéis): itens prontos para retirada. Busque por série, patrimônio, MAC ou nome do
                cliente vinculado. Um selo{' '}
                <strong className="font-medium text-foreground">"Estoque baixo"</strong> aparece
                quando o saldo fica igual ou abaixo do limite configurado em Gerenciar &gt;
                Configurações.
              </li>
              <li>
                <strong className="font-medium text-foreground">Meu Estoque</strong> (todos os
                papéis): equipamentos e consumíveis sob sua custódia. Use{' '}
                <strong className="font-medium text-foreground">"Instalar/Usar"</strong> ao instalar
                em cliente, ou{' '}
                <strong className="font-medium text-foreground">"Devolver na Sede"</strong> ao
                devolver.
              </li>
              <li>
                <strong className="font-medium text-foreground">Por Técnico</strong> (Admin e
                Gestor Técnico): lista expansível — clique no nome do técnico para ver o que ele tem
                em posse. Serializados e consumíveis aparecem em seções separadas. Técnicos sem
                nenhum item ficam ocultos.
              </li>
              <li>
                <strong className="font-medium text-foreground">Lançar Recolhimento</strong> (Admin
                e Gestor Técnico): registra o recolhimento de um item instalado em cliente, com
                busca e paginação. Já cria a tarefa e move o item automaticamente.
              </li>
              <li>
                <strong className="font-medium text-foreground">Em Análise</strong> (todos os
                papéis): itens aguardando decisão de reparo ou baixa. Admin e Gestor Técnico
                registram o resultado.
              </li>
              <li>
                <strong className="font-medium text-foreground">Cadastro</strong> (Admin e Gestor
                Técnico): cadastra produtos e itens serializados/consumíveis.
              </li>
              <li>
                <strong className="font-medium text-foreground">Histórico de Movimentações</strong>{' '}
                (Admin e Gestor Técnico): lista todas as entradas, saídas, retiradas, devoluções e
                baixas, mais recentes primeiro. Busque por produto, série, técnico ou observação;
                filtre por tipo de movimento; use "Carregar mais" para navegar em lotes de 30.
              </li>
            </ul>
          </div>
          <p>
            O botão{' '}
            <strong className="font-medium text-foreground">"Exportar Relatório"</strong> (Admin e
            Gestor Técnico) gera uma planilha Excel completa.
          </p>
        </div>
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
                Ação{' '}
                <strong className="font-medium text-foreground">"Editar"</strong>: permite alterar
                o e-mail e redefinir a senha de qualquer usuário diretamente pelo painel Admin, sem
                precisar que a pessoa faça isso por conta própria.
              </li>
              <li>
                Ative ou desative um usuário pelo toggle{' '}
                <strong className="font-medium text-foreground">Ativo/Inativo</strong> — usuários
                inativos não conseguem fazer login.
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
      id: 'documentos',
      titulo: 'Documentos',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Biblioteca de documentos e manuais da empresa: POPs operacionais, documentos jurídicos
            (LGPD), identidade de marca e código de conduta.
          </li>
          <li>
            Os documentos são exibidos em cards agrupados por categoria (Operacional, Jurídico,
            Marca, RH). Use o campo de busca para filtrar por título ou descrição.
          </li>
          <li>
            O botão{' '}
            <strong className="font-medium text-foreground">"Abrir"</strong> abre o documento em
            nova aba — documentos ainda sem link exibem o botão desabilitado até que um endereço
            seja cadastrado.
          </li>
          <li>
            Admin cria, edita, ativa ou desativa documentos em{' '}
            <strong className="font-medium text-foreground">Gerenciar → Configurações</strong>{' '}
            — sem precisar de código ou acesso ao banco.
          </li>
        </ul>
      ),
    },
    {
      id: 'recursos',
      titulo: 'Recursos',
      conteudo: (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Links rápidos para sistemas e ferramentas externas usados na operação: Portal IXC,
            Mundiale / Wit Desk, Meta Business Suite, App Fibron (Android e iOS) e Site
            Institucional.
          </li>
          <li>
            Use o campo de busca para filtrar por título ou descrição. O botão{' '}
            <strong className="font-medium text-foreground">"Acessar"</strong> abre o sistema
            externo em nova aba.
          </li>
          <li>
            Admin cria, edita, ativa ou desativa recursos em{' '}
            <strong className="font-medium text-foreground">Gerenciar → Configurações</strong>{' '}
            — sem precisar de código ou acesso ao banco.
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
            <strong className="font-medium text-foreground">Admin:</strong> acesso total a todos os
            módulos e usuários. Define o limite de alerta de estoque baixo em Gerenciar &gt;
            Configurações; edita e-mails, redefine senhas e ativa/desativa usuários em Gerenciar
            &gt; Usuários.
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Técnico:</strong> gerencia o
            Estoque completo (cadastro, retirada, recolhimento, baixa, histórico), incluindo criar
            e editar produtos e categorias de produto, e as tarefas da equipe técnica — pode editar
            título, descrição, prioridade, prazo (com motivo de reagendamento), checklist, anexos,
            tags e responsável de qualquer tarefa da equipe, exceto tarefas atribuídas a um Admin.
            Tem visão ampla de todos os Tickets, respondendo principalmente pelos chamados técnicos
            (suporte, conexão, instalação).
          </li>
          <li>
            <strong className="font-medium text-foreground">Gestor Comercial:</strong> gerencia a
            Prospecção Comercial e tem visão ampla de todos os Tickets — respondendo principalmente
            pelos chamados comerciais e financeiros (cobrança, negociação, cancelamento).
          </li>
          <li>
            <strong className="font-medium text-foreground">Usuário comum:</strong> vê e cria
            apenas as próprias tarefas; no Estoque acessa{' '}
            <strong className="font-medium text-foreground">Meu Estoque</strong>,{' '}
            <strong className="font-medium text-foreground">Disponível</strong> e{' '}
            <strong className="font-medium text-foreground">Em Análise</strong>; nos Tickets vê
            apenas os chamados atribuídos a si; no Calendário vê apenas as próprias tarefas.
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
