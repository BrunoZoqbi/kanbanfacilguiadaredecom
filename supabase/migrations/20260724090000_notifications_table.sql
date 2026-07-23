-- Sistema de notificações internas: tabela + RPC de criação (chamada tanto
-- pelo frontend — tarefa atribuída, resposta de ticket — quanto por outras
-- RPCs no banco — estoque baixo).
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, lida) WHERE lida = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve as proprias notificacoes ou admin ve todas" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Só marcar como lida (o frontend só faz UPDATE lida) — não há policy de
-- INSERT/DELETE para authenticated, então RLS nega os dois por padrão;
-- criação é só via criar_notificacao (SECURITY DEFINER, bypassa RLS).
CREATE POLICY "Usuario marca as proprias notificacoes como lidas" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SECURITY DEFINER sem checagem de papel — é a "primitiva" de notificação
-- chamada tanto por outras RPCs (estoque baixo) quanto diretamente pelo
-- frontend (tarefa atribuída, resposta de ticket). Isso significa que
-- qualquer usuário autenticado pode chamá-la para inserir uma notificação
-- em nome de qualquer outro user_id (ex: link malicioso) — risco aceito
-- por ora a pedido explícito do escopo deste prompt; considerar migrar os
-- dois disparos do frontend para dentro de RPCs/triggers de banco (que já
-- validam o contexto da ação) antes de expor isso amplamente.
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_user_id UUID,
  p_tipo TEXT,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, tipo, titulo, mensagem, link)
  VALUES (p_user_id, p_tipo, p_titulo, p_mensagem, p_link);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.criar_notificacao(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
