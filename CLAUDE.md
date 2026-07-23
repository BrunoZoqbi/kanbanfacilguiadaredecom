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
- NUNCA aninhar um elemento interativo do Radix (Checkbox, Switch etc.) dentro de outro elemento clicável (botão, div com onClick) só para fins decorativos. Já causou um bug crítico real: um `<Checkbox>` do Radix aninhado dentro do `<button>` de seleção de tag, ao sincronizar seu `<input>` nativo oculto, disparava um evento `click` sintético com bubble que reacionava o `onClick` do botão pai, entrando num loop infinito de toggle ("Maximum update depth exceeded") — e como não havia Error Boundary, isso derrubava a árvore inteira do React (tela em branco). Quando a interação já é controlada pelo elemento pai, use um indicador visual puro (`div`/`span` com ícone) em vez do componente Radix real.
- RPCs de leitura/agregação que só consultam dados que a RLS já libera (ex: `resumo_estoque_por_status`, `buscar_itens_serializados_disponiveis`) devem usar `SECURITY INVOKER` (padrão), herdando a RLS existente em vez de duplicar checagem de papel dentro da função. Reserve `SECURITY DEFINER` (+ checagem de papel interna) para RPCs que fazem alguma ação/mutação sensível ou que precisam enxergar dados além do que a RLS do chamador permitiria.
- Para listas que crescem sem limite por natureza (histórico de itens, tickets, prospecções — não limitadas por um estado operacional estreito), use busca server-side + paginação por cursor (`useInfiniteQuery`) em vez de carregar tudo de uma vez e filtrar no cliente. Não aplique esse padrão em listas naturalmente pequenas (ex: Meu Estoque, Em Análise, Por Técnico) — a paginação ali só adiciona complexidade sem necessidade.
- `verify_jwt: true` numa Edge Function confirma que o token é válido, NÃO que o chamador é admin. A auditoria revelou que `create-admin-user` aceitava qualquer token válido para criar usuários com papel de admin. Toda Edge Function que executa ação privilegiada DEVE validar o papel do chamador via lookup em `user_roles` DENTRO da própria função. Ver `delete-user/index.ts` como padrão correto.
- Policies RLS de tabelas filhas não herdam automaticamente correções feitas na tabela pai. `ticket_respostas` e `ticket_notas_internas` ficaram sem `is_gestor_comercial()` por semanas depois que a RLS de `tickets` foi atualizada — a inconsistência não gerou erro visível, só silenciou o Gestor Comercial. Sempre auditar todas as tabelas filhas ao corrigir RLS de uma tabela pai.
- Auto-admin hardcoded em trigger de banco é um bloqueante de migração de titularidade: trocar o titular exige migration no schema. O padrão correto é ler de `system_configs` (chave `admin_emails`, lista separada por vírgula) para que o e-mail do titular possa ser atualizado sem alterar código ou schema.
- Tarefas recorrentes usam arquitetura template + instâncias: a tarefa criada pelo usuário com `recurrence_type != 'none'` é o template (`parent_task_id = null`); as ocorrências são instâncias (`parent_task_id = template.id`, `recurrence_type = 'none'`). A Edge Function `gerar-instancias-recorrentes` parte sempre da instância com maior `due_date` existente como ponto de base — nunca recalcular a partir do `due_date` do template original, pois isso causaria duplicatas.
- O projeto Supabase tem ALTER DEFAULT PRIVILEGES concedendo EXECUTE a `anon` em toda função nova criada. Isso significa que TODA nova RPC precisa de `REVOKE EXECUTE ON FUNCTION ... FROM anon` explícito após a criação, ou o advisor de segurança vai apontar exposição pública. Verificar sempre com: `SELECT has_function_privilege('anon', 'nome_da_funcao(args)', 'execute');`
