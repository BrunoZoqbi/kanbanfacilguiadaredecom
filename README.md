# Kanban Fácil — Fibron

Sistema de gestão interna da Fibron (Raul Soares/MG): gestão de tarefas, controle de estoque de equipamentos e prospecção comercial, em uma plataforma única e modular.

## Módulos

- **Tarefas (Kanban)** — quadro de tarefas com anexos (PDF/JPEG/PNG), checklist, comentários, tags e tipos configuráveis. Visibilidade por papel (admin vê tudo; usuário comum só as próprias).
- **Estoque** — controle de equipamentos com rastreamento individual (nº de série, MAC, patrimônio). Fluxo completo: Estoque Disponível → Retirada (Gestor Técnico) → Instalação/Recolhimento → Devolução, com histórico completo de movimentações.
- **Prospecção Comercial** — cadastro de clientes potenciais com checklist de pontuação e classificação automática (baixa/média/alta), gerenciado pelo Gestor Comercial.

## Papéis do sistema

| Papel | Permissões |
|---|---|
| Admin | Acesso total a todos os módulos |
| Gestor Técnico | Gerencia Estoque (retirada/recolhimento) e vê tarefas da equipe (exceto de admins) |
| Gestor Comercial | Gerencia Prospecção (só as próprias) |
| Usuário comum | Vê e cria apenas as próprias tarefas |

## Stack técnico

- **Frontend:** Vite + React 18 + TypeScript + shadcn-ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **PWA:** instalável em dispositivos móveis (vite-plugin-pwa)
- **Hospedagem:** Vercel (deploy automático via push na branch `main`)

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
- **Estoque:** produtos, estoques, itens_serializados, estoque_saldo, movimentacoes_estoque
- **Prospecção:** prospeccoes, prospeccoes_respostas

## Scripts disponíveis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run test` — testes
- `npx tsc --noEmit` — checagem de tipos

## Segurança

Todas as tabelas usam Row Level Security (RLS) do Supabase — as permissões por papel são aplicadas tanto na interface quanto no banco de dados.

---
Projeto desenvolvido por Zoqbi (Bruno Zoqbi) para a Fibron – Raul Soares.
