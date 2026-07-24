-- A policy anterior ((id = auth.uid()) OR is_admin()) impedia qualquer
-- usuário não-admin de ler o profile de outra pessoa — quebrando nomes de
-- responsável em tarefas, seleção de técnico no Estoque, etc para todo
-- papel que não seja Admin. Perfis são dado de referência compartilhado
-- (mesmo padrão de "Everyone can view produtos"); só a conta do próprio
-- chamador precisa estar ativa para poder ler.
DROP POLICY "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Usuários ativos podem ver perfis" ON public.profiles
  FOR SELECT USING (is_user_active());
