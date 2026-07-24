# Kanban Fácil — Fibron

Sistema de gestão interna da Fibron (Raul Soares/MG): tarefas, estoque de equipamentos, prospecção comercial e atendimento de tickets, em uma plataforma única.

**Produção:** gestao.fibrontec.com.br

## Módulos

- **Tarefas (Kanban)** — quadro de tarefas com anexos (imagens e documentos), checklist, comentários, tags e tipos configuráveis. Ao anexar um **PDF**, o texto é extraído automaticamente no navegador e inserido na descrição da tarefa — o arquivo em si não é armazenado; para PDFs sem texto extraível (ex: escaneado), o sistema oferece anexar o arquivo normalmente. O **responsável** pode ser trocado após a criação (Admin e Gestor Técnico), com notificação automática ao novo responsável. **Reagendamento de prazo:** ao alterar o `due_date` de uma tarefa já criada, um modal obrigatório solicita o motivo (Pedido do Técnico, Pedido do Cliente, Condição Externa, Outro) com observação opcional; cada alteração de prazo incrementa `reagendamento_count`, usado nas métricas do Dashboard. Suporta **tarefas recorrentes** (frequência diária, semanal ou mensal): ao criar uma tarefa com recorrência, o sistema gera automaticamente as primeiras instâncias a partir do template. A Edge Function `gerar-instancias-recorrentes` permite criar mais ocorrências manualmente, respeitando os limites de data e quantidade configurados.
- **Estoque** — rastreamento individual de equipamentos (nº de série, MAC, patrimônio): Disponível → Retirada → Instalação → Recolhimento → Devolução → Análise/Baixa. Consumíveis (cabos, conectores etc.) seguem o mesmo padrão de custódia: Entrada na sede → Retirar para Técnico → Usar/Consumir → Devolver à Sede. **8 abas:** **Visão Geral** (Admin/Gestor Técnico — resumo quantitativo por status, categoria e produto; gráficos alternáveis pizza/barras), **Disponível** (todos os papéis — busca por série/MAC/patrimônio; alerta de estoque baixo), **Meu Estoque** (todos os papéis — itens sob sua custódia; instalar/devolver), **Por Técnico** (Admin/Gestor Técnico — lista expansível por técnico), **Lançar Recolhimento** (Admin/Gestor Técnico — registra recolhimento e cria tarefa automaticamente), **Em Análise** (Admin/Gestor Técnico — decisão de reparo ou baixa), **Cadastro** (Admin/Gestor Técnico — cadastra produtos e itens serializados/consumíveis), **Histórico** (Admin/Gestor Técnico — registro completo de movimentações, com busca por produto/série/técnico/observação e filtro por tipo). Admin e Gestor Técnico criam e editam produtos e categorias de produto já cadastrados. Exportação para Excel.
- **Prospecção Comercial** — cadastro de leads com checklist de pontuação e classificação automática (baixa/média/alta). Prospecções "Alta" geram tarefa automática no Kanban. Uma prospecção já cadastrada pode ser reaberta para consultar as respostas do checklist (com pontuação individual, somente leitura) e editar os dados de contato e o status.
- **Tickets** — atendimento de suporte com respostas ao cliente, notas internas privadas, e portal público de consulta (sem login), protegido contra força bruta.
- **Scripts de Atendimento** — biblioteca de textos prontos por setor (Comercial, Financeiro, Atendimento Geral e **Suporte Técnico**), organizados por categoria, com busca e cópia rápida. O setor Suporte Técnico inclui as categorias Triagem Remota, Comunicados, Em Campo e Escalonamento — 18 scripts, totalizando 50 no sistema. Edição restrita ao Admin, na aba "Gerenciar".
- **Notificações** — página `/notificacoes` com histórico completo e paginado das notificações do usuário, "Marcar todas como lidas" e marcação individual ao clicar. Disparos automáticos: tarefa atribuída a você, resposta em ticket que você abriu, e estoque baixo (para Admin/Gestor Técnico). Badge de não lidas na barra lateral atualiza em tempo real via Supabase Realtime.
- **Dashboard** (Admin) — painel consolidado com um resumo executivo de cada módulo (Tarefas, Reagendamentos, Estoque, Prospecção e Tickets) reunido em abas numa única tela. A aba **Reagendamentos** traz cards de resumo (cumpridas no prazo, reagendadas e atrasadas, com percentuais), um gráfico de distribuição por motivo de reagendamento (toggle pizza/barras) e uma tabela de desempenho por técnico/usuário ordenada pela taxa de cumprimento no prazo (pior desempenho primeiro), com filtro de período (30/60/90 dias ou personalizado).
- **Documentos** — biblioteca de documentos e manuais da empresa (Manual do Sistema, POPs operacionais, Política de Privacidade/LGPD, Brandbook, Código de Conduta, etc.), agrupados por categoria (Operacional, Jurídico, Marca, RH), com busca por título ou descrição e botão "Abrir" em nova aba. Admin gerencia (criar, editar, ativar/desativar) em Gerenciar → Configurações — sem precisar de código.
- **Recursos** — links para sistemas e ferramentas externas da operação (Portal IXC, Mundiale / Wit Desk, Meta Business Suite, App Fibron Android/iOS, Site Institucional), com busca e botão "Acessar" em nova aba. Admin gerencia em Gerenciar → Configurações — sem precisar de código.
- **Meu Perfil** — cada usuário edita o próprio nome e WhatsApp, e troca a própria senha (informando a atual).

## Navegação / Interface

Barra lateral: o bloco avatar/nome/papel é clicável e leva a "Meu Perfil" (nome com sublinhado ao passar o mouse). O sino de notificações (com badge de não lidas atualizado em tempo real) fica ao lado do nome e navega para `/notificacoes`. **Ordem dos itens do menu:** Dashboard (Admin) → Minhas Tarefas → Kanban → Calendário → Prospecção (Admin + Gestor Comercial) → Scripts → Tickets → Estoque → Gerenciar (Admin) → Documentos → Recursos → Ajuda. O item "Notificações" foi removido do menu por ser redundante com o sino, que já navega para `/notificacoes`. O botão **"Sair"** fica fixo no rodapé da barra lateral, separado da navegação por uma linha divisória. No **mobile**, o cabeçalho superior exibe apenas o ícone ☰ para abrir a sidebar (logo pendente de implementação); no desktop o cabeçalho é removido.

## Papéis do sistema

| Papel | Permissões |
|---|---|
| Admin | Acesso total a todos os módulos |
| Gestor Técnico | Gerencia Estoque (retirada/recolhimento, cadastro de produtos e categorias), vê tarefas da equipe (exceto de admins) e tem visão ampla de Tickets — responde principalmente pelos chamados técnicos (suporte, conexão, instalação) |
| Gestor Comercial | Gerencia Prospecção e tem visão ampla de Tickets — responde principalmente pelos chamados comerciais e financeiros (cobrança, negociação, cancelamento) |
| Usuário comum | Vê e cria apenas as próprias tarefas; usa Estoque e Tickets atribuídos a si |

## Stack técnico

- **Frontend:** Vite + React 18 + TypeScript + shadcn-ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **PWA:** instalável em dispositivos móveis
- **Hospedagem:** Vercel (deploy automático via push/merge na branch `main`)
- **CI:** GitHub Actions roda type-check + build em toda pull request

## Desenvolvimento local

```sh
git clone https://github.com/BrunoZoqbi/kanbanfacilguiadaredecom.git
cd kanbanfacilguiadaredecom
npm install
cp .env.example .env
# Preencha o .env com as credenciais do projeto Supabase (peça ao administrador do sistema)
npm run dev
```

## Estrutura do banco de dados

Migrations em `supabase/migrations/`. Principais grupos de tabelas:
- **Núcleo:** profiles, user_roles (`UNIQUE(user_id)` garante um papel por usuário)
- **Tarefas:** tasks, task_tags, task_comments, task_checklist_items, task_attachments, task_types, activity_logs. Campos de recorrência em `tasks`: `recurrence_type` (enum: none/daily/weekly/monthly), `recurrence_interval`, `recurrence_days` (array de dia-da-semana para semanal), `recurrence_time`, `recurrence_end_date`, `recurrence_end_after`, `parent_task_id` (null = template ou tarefa avulsa; preenchido = instância gerada).
- **Estoque:** produtos, categorias_produto, estoques, itens_serializados, estoque_saldo, consumivel_saldo_tecnico, movimentacoes_estoque
- **Prospecção:** prospeccoes, prospeccoes_respostas
- **Tickets:** tickets, ticket_respostas, ticket_notas_internas, ticket_consulta_tentativas
- **Scripts de Atendimento:** scripts_atendimento
- **Documentos e Recursos:** recursos_documentos, recursos_links

Principais RPCs de Estoque: `lancar_entrada_consumivel`, `lancar_saida_consumivel`, `retirar_consumivel_para_tecnico`, `lancar_uso_consumivel`, `devolver_consumivel_sede` (ciclo de consumíveis), `resumo_estoque_por_status` (painel "Visão Geral" / Dashboard) e `buscar_itens_serializados_disponiveis` (busca + paginação server-side).

## Segurança

- Row Level Security (RLS) em todas as tabelas — permissões aplicadas na interface e no banco.
- Contas desativadas são bloqueadas em cascata (login, RLS, funções RPC).
- Portal público de tickets com limite de tentativas (anti força-bruta) e minimização de dados pessoais.
- Funções sensíveis de estoque e usuários rodam como RPC com validação de permissão própria (SECURITY DEFINER).
- Admin pode editar o e-mail e redefinir a senha de qualquer usuário, via edge functions dedicadas (`update-user-email`, `reset-user-password`) que validam o papel de quem chama no servidor antes de agir.
- **Auditoria de segurança aplicada (PR #38):** validação de papel server-side adicionada à Edge Function `create-admin-user` (antes, qualquer token válido podia criar usuários admin); auto-admin configurável via `system_configs` (chave `admin_emails`) em vez de e-mail hardcoded no trigger; RLS corrigida em `ticket_respostas` e `ticket_notas_internas` para incluir Gestor Comercial; policy permissiva de storage removida; constraint `UNIQUE(user_id)` adicionada em `user_roles`; 5 índices de performance criados (`tasks(assignee_id)`, `tasks(created_by_id)`, `ticket_respostas(ticket_id)`, `ticket_notas_internas(ticket_id)`, `movimentacoes_estoque(produto_id)`).
- **Correção de RLS do Gestor Técnico (PR #44):** `task_checklist_items`, `task_attachments` e `task_tags` não herdavam a permissão de Gestor Técnico já existente em `tasks` — corrigido para incluir o mesmo padrão de acesso (tarefas da equipe técnica, exceto as atribuídas a um Admin).
- **RLS de `profiles` corrigida (PR #59):** o SELECT de `profiles` passou de `(id = auth.uid()) OR is_admin()` para `is_user_active()` — antes, qualquer papel não-admin só conseguia ler o próprio perfil, o que quebrava a exibição de nomes de responsável em tarefas e a seleção de técnico no Estoque. Agora qualquer conta ativa lê o perfil de qualquer colega, mesmo padrão de dado de referência compartilhado usado em `produtos`/`categorias_produto`.
- **Papel em tempo real (PR #59):** `user_roles` foi adicionada à publication `supabase_realtime` — uma promoção ou rebaixamento de papel feito pelo Admin em Gerenciar → Usuários se propaga imediatamente para a sessão já aberta do usuário afetado, sem precisar de logout/login.

## Confiabilidade

- Error Boundary global (React) captura erros não tratados em qualquer componente e mostra uma mensagem amigável com botão de recarregar, em vez de deixar a tela em branco.
- O formulário de criação de tarefa salva um rascunho automático em `sessionStorage` (título, descrição e demais campos preenchidos) a cada alteração, recuperado automaticamente se a aba for reaberta na mesma sessão.

## Scripts disponíveis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes
- `npx tsc --noEmit` — checagem de tipos

## Documentação

Manual de uso e POPs operacionais mantidos separadamente pela consultoria responsável.

---
Projeto desenvolvido sob demanda para uso interno da empresa.
