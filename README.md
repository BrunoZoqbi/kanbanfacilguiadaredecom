# Kanban Fácil — Fibron

Sistema de gestão interna da Fibron (Raul Soares/MG): tarefas, estoque de equipamentos, prospecção comercial e atendimento de tickets, em uma plataforma única.

**Produção:** gestao.fibrontec.com.br

## Módulos

- **Tarefas (Kanban)** — quadro de tarefas com anexos (PDF/JPEG/PNG), checklist, comentários, tags e tipos configuráveis. Suporta **tarefas recorrentes** (frequência diária, semanal ou mensal): ao criar uma tarefa com recorrência, o sistema gera automaticamente as primeiras instâncias a partir do template. A Edge Function `gerar-instancias-recorrentes` permite criar mais ocorrências manualmente, respeitando os limites de data e quantidade configurados.
- **Estoque** — rastreamento individual de equipamentos (nº de série, MAC, patrimônio): Disponível → Retirada → Instalação → Recolhimento → Devolução → Análise/Baixa. Consumíveis (cabos, conectores etc.) seguem o mesmo padrão de custódia usado nos equipamentos: Entrada na sede → Retirar para Técnico → Usar/Consumir → Devolver à Sede. Aba "Visão Geral" com resumo quantitativo por status, categoria e produto. Admin edita produtos e categorias já cadastrados (antes só era possível desativar). Alerta de estoque baixo, busca com paginação na lista de itens disponíveis, e exportação para Excel.
- **Prospecção Comercial** — cadastro de leads com checklist de pontuação e classificação automática (baixa/média/alta). Prospecções "Alta" geram tarefa automática no Kanban. Uma prospecção já cadastrada pode ser reaberta para consultar as respostas do checklist (com pontuação individual, somente leitura) e editar os dados de contato e o status.
- **Tickets** — atendimento de suporte com respostas ao cliente, notas internas privadas, e portal público de consulta (sem login), protegido contra força bruta.
- **Scripts de Atendimento** — biblioteca de textos prontos por setor (Comercial, Financeiro, Atendimento Geral), organizados por categoria, com busca e cópia rápida. Edição restrita ao Admin, na aba "Gerenciar".
- **Dashboard** (Admin) — painel consolidado com um resumo executivo de cada módulo (Tarefas, Estoque, Prospecção e Tickets) reunido em abas numa única tela.
- **Meu Perfil** — cada usuário edita o próprio nome e WhatsApp, e troca a própria senha (informando a atual).

## Papéis do sistema

| Papel | Permissões |
|---|---|
| Admin | Acesso total a todos os módulos |
| Gestor Técnico | Gerencia Estoque (retirada/recolhimento), vê tarefas da equipe (exceto de admins) e tem visão ampla de Tickets — responde principalmente pelos chamados técnicos (suporte, conexão, instalação) |
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

Principais RPCs de Estoque: `lancar_entrada_consumivel`, `lancar_saida_consumivel`, `retirar_consumivel_para_tecnico`, `lancar_uso_consumivel`, `devolver_consumivel_sede` (ciclo de consumíveis), `resumo_estoque_por_status` (painel "Visão Geral" / Dashboard) e `buscar_itens_serializados_disponiveis` (busca + paginação server-side).

## Segurança

- Row Level Security (RLS) em todas as tabelas — permissões aplicadas na interface e no banco.
- Contas desativadas são bloqueadas em cascata (login, RLS, funções RPC).
- Portal público de tickets com limite de tentativas (anti força-bruta) e minimização de dados pessoais.
- Funções sensíveis de estoque e usuários rodam como RPC com validação de permissão própria (SECURITY DEFINER).
- Admin pode editar o e-mail e redefinir a senha de qualquer usuário, via edge functions dedicadas (`update-user-email`, `reset-user-password`) que validam o papel de quem chama no servidor antes de agir.
- **Auditoria de segurança aplicada (PR #38):** validação de papel server-side adicionada à Edge Function `create-admin-user` (antes, qualquer token válido podia criar usuários admin); auto-admin configurável via `system_configs` (chave `admin_emails`) em vez de e-mail hardcoded no trigger; RLS corrigida em `ticket_respostas` e `ticket_notas_internas` para incluir Gestor Comercial; policy permissiva de storage removida; constraint `UNIQUE(user_id)` adicionada em `user_roles`; 5 índices de performance criados (`tasks(assignee_id)`, `tasks(created_by_id)`, `ticket_respostas(ticket_id)`, `ticket_notas_internas(ticket_id)`, `movimentacoes_estoque(produto_id)`).

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
