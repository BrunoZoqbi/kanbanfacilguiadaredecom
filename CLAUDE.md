# Kanban Fácil — Guia para Sessões do Claude Code

## Stack

Vite + React 18 + TypeScript + shadcn-ui + Tailwind + Supabase (Postgres, Auth, Storage, Edge Functions) + Vercel.

## IMPORTANTE — Migrations podem já estar aplicadas em produção sem arquivo local

O consultor do projeto (Claude, via chat separado com acesso direto ao Supabase MCP) às vezes aplica schema/RLS/seed diretamente em produção antes de existir um arquivo de migration local. NUNCA assuma que "não tem migration local" significa "não existe no banco". Antes de recriar algo do zero, verifique o schema real (via Supabase MCP ou CLI) e, se já existir, apenas reconcilie o arquivo local — não reaplique.

## Política de branch

Sessões na nuvem devem desenvolver em branch própria (`claude/*`) e abrir PR — nunca commitar direto em `main`. Merge só acontece mediante instrução explícita do usuário.

## Matriz de papéis (CRÍTICO — não copiar RLS de um módulo para outro sem checar)

| Papel | Domínio |
|---|---|
| Admin | Acesso total |
| Gestor Técnico | Estoque (retirada/recolhimento/baixa) + Tickets técnicos (suporte/conexão/instalação) + tarefas da equipe técnica |
| Gestor Comercial | Prospecção Comercial (só próprias) + Tickets comerciais/financeiros (cobrança/negociação/cancelamento) |
| Usuário comum | Só as próprias tarefas; Estoque (instalar/devolver); Tickets atribuídos |

Tickets é módulo COMPARTILHADO entre Gestor Técnico e Gestor Comercial (ambos com acesso amplo) — não copiar o padrão de "só um gestor" de outro módulo sem confirmar.

## Documentação — regra de nomenclatura

NUNCA usar nomes próprios de pessoas em README, Ajuda.tsx, comentários de código ou textos de UI — sempre referenciar pelo PAPEL (Admin, Gestor Técnico, Gestor Comercial). Responsáveis por cada função podem mudar.

## Performance

Bundle principal deve ficar abaixo de ~1MB. Novas páginas/rotas devem usar `React.lazy()`. Bibliotecas pesadas (xlsx, jspdf) devem ser importadas via `import()` dinâmico, só no momento do uso.

## Antes de finalizar qualquer sessão

Rode `npx tsc --noEmit` e `npx vite build`. Nunca deixe erro de tipo ou build quebrado numa PR.

## Lições de sessões anteriores

- Copiar a política de RLS de um módulo para outro sem adaptar já gerou erro real (Tickets herdou a regra de "só um gestor" do Estoque, quando deveria ser compartilhado com Gestor Comercial). Sempre confirmar a matriz de papéis do módulo específico antes de reusar RLS de outro.
- Ações aplicadas direto em produção via integração (fora desta sessão) geram "schema drift" — sempre verificar o schema real do banco antes de assumir que algo não existe só porque não tem arquivo de migration local.
- Toda mudança em Edge Function sensível (que altera dado de outro usuário) deve validar o papel de quem chama DENTRO da própria função, nunca confiar só na interface para bloquear o botão.
