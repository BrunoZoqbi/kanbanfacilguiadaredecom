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
- REVOKE EXECUTE ON FUNCTION ... FROM anon não é suficiente — o Postgres também concede EXECUTE a PUBLIC por padrão. Sempre revogar de ambos: REVOKE EXECUTE ON FUNCTION nome(args) FROM anon; REVOKE EXECUTE ON FUNCTION nome(args) FROM PUBLIC; Verificar com has_function_privilege('anon',...) E has_function_privilege('public',...) após revogar.
- user_roles não estava na publication supabase_realtime — mudanças de papel feitas pelo Admin (promoção/rebaixamento) não se propagavam para usuários com sessão ativa. Sempre adicionar tabelas de controle de acesso à publication: ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
- AuthContext: query de user_roles ignorava o campo error silenciosamente, convertendo falhas transientes em role='user'. Sempre verificar if (error) antes de usar data em queries críticas de autenticação.
- canEdit no frontend deve sempre espelhar a RLS do banco. Divergências criam situações onde o banco permitiria a ação mas o frontend bloqueia silenciosamente, forçando usuários a papéis mais elevados do que necessário. Verificar sempre se a policy de UPDATE da tabela e o gate canEdit no componente estão em sincronia — exemplo real: Gestor Técnico tinha UPDATE permitido na RLS de tasks, mas canEdit no TaskDetailModal só verificava isAdmin || assignee, forçando a responsável técnica a virar Admin para gerenciar tarefas da equipe.
- pdfjs-dist com importação estática estoura o bundle principal. Sempre usar import() dinâmico para bibliotecas pesadas de processamento — o carregamento ocorre só quando o usuário seleciona um PDF, não no carregamento da página.
- A tabela ticket_consulta_tentativas tem RLS habilitada mas zero policies — isso é intencional. A tabela só é escrita pela Edge Function consultar-ticket via service role (rate limiting do portal público). Nenhum usuário autenticado precisa ler essa tabela diretamente. Se precisar auditar tentativas, usar o Supabase Dashboard ou uma RPC admin dedicada.
- Scripts de atendimento têm 4 setores: comercial, financeiro, atendimento_geral e suporte_tecnico. Ao adicionar novo setor ao enum setor_script no banco, sempre atualizar também: src/types/scripts.ts (SetorScript + SETOR_SCRIPT_LABELS), src/pages/Scripts.tsx (nova aba), src/integrations/supabase/types.ts (enum). A migration local deve usar ADD VALUE IF NOT EXISTS para evitar erro se já existir.
- A ordem dos itens do menu em AppLayout.tsx é: Notificações, Dashboard (admin only), Minhas Tarefas, Kanban, Calendário, Prospecção (admin+gestor_comercial), Scripts, Tickets, Estoque, Gerenciar (admin only), Documentos, Recursos, Ajuda. Manter essa ordem ao adicionar novos itens.
- Módulos Documentos (/documentos) e Recursos (/recursos) são páginas de referência gerenciadas pelo Admin via painel interno — sem código. Ao adicionar novo item, o Admin usa Gerenciar → Configurações. URLs marcadas como '#' são placeholders aguardando links reais do Google Drive ou storage externo.
- Elemento HTML `<a>` não suporta o atributo disabled (só form elements suportam). Ao usar Button asChild com `<a>` filho para links externos, usar render condicional: URL placeholder ('#') → Button simples com disabled=true (sem asChild); URL real → Button asChild com `<a target='_blank'>`. Propagar disabled para `<a>` via Radix Slot causa comportamento inconsistente entre browsers sem erro de TypeScript ou build.
- Nunca importar do lucide-react ícones cujo nome colide com construtores ou globais do JavaScript sem alias explícito. Exemplos problemáticos: Map, Set, Image, Link, Menu, Monitor, Search. O conflito não aparece no TypeScript nem no vite build, mas causa TypeError em runtime ('X is not a constructor') capturado silenciosamente pelo Error Boundary — a página exibe 'Algo deu errado' sem pista visível no console do usuário. Correção: `import { Map as MapIcon } from 'lucide-react'` e usar MapIcon em todo o componente.
- O modal de reagendamento (motivo obrigatório ao alterar due_date) respeita canEdit — aparece para Admin, Gestor Técnico e usuário comum nas próprias tarefas. Os campos reagendamento_* são gravados só na tarefa editada, nunca propagados para o template ou instâncias futuras de tarefas recorrentes — cada instância tem seu próprio due_date calculado pela Edge Function.
