-- O advisor de segurança do Supabase apontou que criar_notificacao (e
-- buscar_movimentacoes_estoque, de uma migration anterior) ficaram
-- executáveis pelo papel `anon` — CREATE FUNCTION concede EXECUTE a
-- PUBLIC por padrão no Postgres, e nenhuma das duas migrations revogou
-- isso antes de conceder a `authenticated`. Sem login, qualquer um
-- conseguiria chamar essas RPCs via /rest/v1/rpc/. Revoga de PUBLIC
-- (cobre anon) e mantém só authenticated.
REVOKE EXECUTE ON FUNCTION public.criar_notificacao(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_notificacao(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.buscar_movimentacoes_estoque(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_movimentacoes_estoque(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
