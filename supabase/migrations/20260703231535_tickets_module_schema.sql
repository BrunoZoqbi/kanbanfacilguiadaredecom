-- Módulo de Tickets: chamados de suporte/atendimento, com respostas ao
-- cliente e notas internas da equipe.
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project,
-- including the later fix that added is_gestor_comercial() to the broad-access
-- policies of public.tickets — Tickets é compartilhado entre Gestor Técnico e
-- Gestor Comercial, cada um responsável pelos chamados da sua área.)

CREATE TYPE public.status_ticket AS ENUM ('aberto', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado');
CREATE TYPE public.prioridade_ticket AS ENUM ('baixa', 'media', 'alta', 'urgente');

CREATE SEQUENCE public.ticket_numero_seq START WITH 1001;

CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ticket INTEGER NOT NULL UNIQUE DEFAULT nextval('public.ticket_numero_seq'),
  nome_cliente TEXT NOT NULL,
  cpf_ou_contrato TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo_problema TEXT NOT NULL,
  descricao TEXT NOT NULL,
  status public.status_ticket NOT NULL DEFAULT 'aberto',
  prioridade public.prioridade_ticket NOT NULL DEFAULT 'media',
  atendente_id UUID REFERENCES auth.users(id),
  created_by_id UUID REFERENCES auth.users(id),
  sla_prazo TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER SEQUENCE public.ticket_numero_seq OWNED BY public.tickets.numero_ticket;

CREATE INDEX idx_tickets_atendente ON public.tickets(atendente_id);
CREATE INDEX idx_tickets_numero ON public.tickets(numero_ticket);
CREATE INDEX idx_tickets_status ON public.tickets(status);

CREATE TABLE public.ticket_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  autor_id UUID REFERENCES auth.users(id),
  autor_nome TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_notas_internas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  autor_id UUID NOT NULL REFERENCES auth.users(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_notas_internas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tickets: visão e atualização amplas para Admin, Gestor Técnico e Gestor
-- Comercial (Tickets é compartilhado entre os dois papéis de gestão — cada um
-- responsável pelos chamados da sua área). Atendente vê/edita os seus, e quem
-- abriu o chamado também consegue ver o próprio ticket.
CREATE POLICY "Visibilidade de tickets por papel" ON public.tickets
  FOR SELECT USING (
    is_admin() OR is_gestor_tecnico() OR is_gestor_comercial()
    OR atendente_id = auth.uid() OR created_by_id = auth.uid()
  );

CREATE POLICY "Atualização de tickets por papel" ON public.tickets
  FOR UPDATE USING (
    is_admin() OR is_gestor_tecnico() OR is_gestor_comercial()
    OR atendente_id = auth.uid()
  );

CREATE POLICY "Criação de tickets por papel" ON public.tickets
  FOR INSERT WITH CHECK (is_user_active() AND created_by_id = auth.uid());

-- Respostas ao cliente: visíveis/criáveis por quem já tem acesso ao ticket
-- (admin, gestor técnico, atendente responsável, ou quem abriu o chamado).
CREATE POLICY "Ver respostas de tickets acessíveis" ON public.ticket_respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_respostas.ticket_id
        AND (is_admin() OR is_gestor_tecnico() OR t.atendente_id = auth.uid() OR t.created_by_id = auth.uid())
    )
  );

CREATE POLICY "Criar respostas em tickets acessíveis" ON public.ticket_respostas
  FOR INSERT WITH CHECK (
    is_user_active() AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_respostas.ticket_id
        AND (is_admin() OR is_gestor_tecnico() OR t.atendente_id = auth.uid())
    )
  );

-- Notas internas: apenas equipe interna com acesso ao ticket (nunca o
-- cliente/solicitante externo).
CREATE POLICY "Ver notas internas de tickets acessíveis" ON public.ticket_notas_internas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_notas_internas.ticket_id
        AND (is_admin() OR is_gestor_tecnico() OR t.atendente_id = auth.uid())
    )
  );

CREATE POLICY "Criar notas internas em tickets acessíveis" ON public.ticket_notas_internas
  FOR INSERT WITH CHECK (
    is_user_active() AND autor_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_notas_internas.ticket_id
        AND (is_admin() OR is_gestor_tecnico() OR t.atendente_id = auth.uid())
    )
  );
