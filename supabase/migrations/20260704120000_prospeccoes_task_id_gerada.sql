-- Links a prospecção to the Kanban task auto-created for it when it's
-- scored 'alta' (see useProspeccoes.createProspeccao on the frontend).
-- (Mirrors the schema already applied directly on the vbgozbqbixofqvwnnuxh project.)

ALTER TABLE public.prospeccoes
  ADD COLUMN task_id_gerada UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
