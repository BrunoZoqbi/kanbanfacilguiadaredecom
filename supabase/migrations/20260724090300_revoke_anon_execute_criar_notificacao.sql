-- A migration anterior revogou EXECUTE de PUBLIC, mas o advisor de
-- segurança continuou apontando essas duas funções como executáveis por
-- `anon`. Causa: este projeto tem ALTER DEFAULT PRIVILEGES concedendo
-- EXECUTE a `anon` explicitamente (grant próprio, não herdado de PUBLIC)
-- em toda função nova — confirmado via information_schema.routine_privileges.
-- Revoga de `anon` diretamente, que é o que efetivamente fecha o acesso
-- sem login.
REVOKE EXECUTE ON FUNCTION public.criar_notificacao(UUID, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.buscar_movimentacoes_estoque(TEXT, TEXT, INTEGER, INTEGER) FROM anon;
