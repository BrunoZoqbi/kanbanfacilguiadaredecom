-- Adds the 'gestor_tecnico' role: manages stock movements (retirar/recolher)
-- and can create/assign tasks to non-admin users.
ALTER TYPE public.app_role ADD VALUE 'gestor_tecnico';
