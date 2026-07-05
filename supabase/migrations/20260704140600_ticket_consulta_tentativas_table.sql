-- Anti força-bruta para o portal público de tickets (consultar-ticket v2):
-- registra cada tentativa de consulta (por número de ticket e por IP) para
-- permitir throttling de 5 tentativas incorretas a cada 15 minutos.
-- Sem políticas de acesso — RLS habilitada e sem policies significa que só
-- a service role (usada pela edge function) lê/escreve nesta tabela.
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project.)

CREATE TABLE public.ticket_consulta_tentativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket INTEGER NOT NULL,
  ip TEXT,
  sucesso BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_consulta_tentativas ENABLE ROW LEVEL SECURITY;
