-- Suporte a tarefas recorrentes
-- parent_task_id = NULL  →  tarefa avulsa ou template de recorrência
-- parent_task_id = <uuid> →  instância gerada por um template

CREATE TYPE public.recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly');

ALTER TABLE public.tasks
  ADD COLUMN recurrence_type     public.recurrence_type NOT NULL DEFAULT 'none',
  ADD COLUMN recurrence_days     integer[]              NULL,          -- 0=Dom…6=Sáb, usado em 'weekly'
  ADD COLUMN recurrence_time     time                   NULL,          -- horário das instâncias (HH:MM)
  ADD COLUMN recurrence_interval integer                NOT NULL DEFAULT 1,
  ADD COLUMN recurrence_end_date date                   NULL,
  ADD COLUMN recurrence_end_after integer               NULL,          -- após N ocorrências
  ADD COLUMN parent_task_id      uuid                   NULL
    REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_parent_task_id
  ON public.tasks(parent_task_id)
  WHERE parent_task_id IS NOT NULL;
