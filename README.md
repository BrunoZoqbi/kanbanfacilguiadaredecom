# Kanban Fácil — Fibron

Sistema de gestão interna da Fibron (Raul Soares/MG): tarefas, estoque de equipamentos, prospecção comercial e atendimento de tickets, em uma plataforma única.

**Produção:** gestao.fibrontec.com.br

## Módulos

- **Tarefas (Kanban)** — quadro de tarefas com anexos (PDF/JPEG/PNG), checklist, comentários, tags e tipos configuráveis.
- **Estoque** — rastreamento individual de equipamentos (nº de série, MAC, patrimônio). Ciclo completo: Disponível → Retirada → Instalação → Recolhimento → Devolução → Análise/Baixa. Alerta de estoque baixo e exportação para Excel.
- **Prospecção Comercial** — cadastro de leads com checklist de pontuação e classificação automática (baixa/média/alta). Prospecções "Alta" geram tarefa automática no Kanban.
- **Tickets** — atendimento de suporte com respostas ao cliente, notas internas privadas, e portal público de consulta (sem login), protegido contra força bruta.
- **Scripts de Atendimento** — biblioteca de textos prontos por setor (Comercial, Financeiro, Atendimento Geral), organizados por categoria, com busca e cópia rápida. Edição restrita ao Admin, na aba "Gerenciar".
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
- **Núcleo:** profiles, user_roles
- **Tarefas:** tasks, task_tags, task_comments, task_checklist_items, task_attachments, task_types, activity_logs
- **Estoque:** produtos, categorias_produto, estoques, itens_serializados, estoque_saldo, movimentacoes_estoque
- **Prospecção:** prospeccoes, prospeccoes_respostas
- **Tickets:** tickets, ticket_respostas, ticket_notas_internas, ticket_consulta_tentativas
- **Scripts de Atendimento:** scripts_atendimento

## Segurança

- Row Level Security (RLS) em todas as tabelas — permissões aplicadas na interface e no banco.
- Contas desativadas são bloqueadas em cascata (login, RLS, funções RPC).
- Portal público de tickets com limite de tentativas (anti força-bruta) e minimização de dados pessoais.
- Funções sensíveis de estoque e usuários rodam como RPC com validação de permissão própria (SECURITY DEFINER).
- Admin pode editar o e-mail e redefinir a senha de qualquer usuário, via edge functions dedicadas (`update-user-email`, `reset-user-password`) que validam o papel de quem chama no servidor antes de agir.

## Scripts disponíveis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes
- `npx tsc --noEmit` — checagem de tipos

## Documentação

Manual de uso e POPs operacionais mantidos separadamente pela consultoria (Zoqbi).

---
Projeto desenvolvido por Zoqbi (Bruno Zoqbi) para a Fibron – Raul Soares.
