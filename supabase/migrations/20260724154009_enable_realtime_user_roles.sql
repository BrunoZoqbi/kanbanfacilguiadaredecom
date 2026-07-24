-- Permite ao AuthContext assinar mudanças em user_roles para a própria
-- linha (RLS "Users can view own role" já libera user_id = auth.uid()) —
-- sem isso, um usuário promovido/rebaixado por um admin só veria o novo
-- papel depois de deslogar e logar de novo.
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
