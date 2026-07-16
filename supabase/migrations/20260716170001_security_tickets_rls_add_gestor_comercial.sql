-- I1: Add is_gestor_comercial() to ticket_respostas and ticket_notas_internas policies.

-- ticket_respostas SELECT
DROP POLICY "Ver respostas de tickets acessíveis" ON public.ticket_respostas;
CREATE POLICY "Ver respostas de tickets acessíveis" ON public.ticket_respostas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_respostas.ticket_id
        AND (
          is_admin()
          OR is_gestor_tecnico()
          OR is_gestor_comercial()
          OR t.atendente_id = auth.uid()
          OR t.created_by_id = auth.uid()
        )
    )
  );

-- ticket_respostas INSERT
DROP POLICY "Criar respostas em tickets acessíveis" ON public.ticket_respostas;
CREATE POLICY "Criar respostas em tickets acessíveis" ON public.ticket_respostas
  FOR INSERT WITH CHECK (
    is_user_active()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_respostas.ticket_id
        AND (
          is_admin()
          OR is_gestor_tecnico()
          OR is_gestor_comercial()
          OR t.atendente_id = auth.uid()
        )
    )
  );

-- ticket_notas_internas SELECT
DROP POLICY "Ver notas internas de tickets acessíveis" ON public.ticket_notas_internas;
CREATE POLICY "Ver notas internas de tickets acessíveis" ON public.ticket_notas_internas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_notas_internas.ticket_id
        AND (
          is_admin()
          OR is_gestor_tecnico()
          OR is_gestor_comercial()
          OR t.atendente_id = auth.uid()
        )
    )
  );

-- ticket_notas_internas INSERT
DROP POLICY "Criar notas internas em tickets acessíveis" ON public.ticket_notas_internas;
CREATE POLICY "Criar notas internas em tickets acessíveis" ON public.ticket_notas_internas
  FOR INSERT WITH CHECK (
    is_user_active()
    AND autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_notas_internas.ticket_id
        AND (
          is_admin()
          OR is_gestor_tecnico()
          OR is_gestor_comercial()
          OR t.atendente_id = auth.uid()
        )
    )
  );
