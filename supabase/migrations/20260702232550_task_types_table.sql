-- Create task_types table for dynamic task type management
CREATE TABLE public.task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- Everyone can view active task types
CREATE POLICY "Everyone can view task types"
  ON public.task_types
  FOR SELECT
  USING (true);

-- Only admins can manage task types
CREATE POLICY "Admins can manage task types"
  ON public.task_types
  FOR ALL
  USING (is_admin());

-- Insert default task types based on existing enum values
INSERT INTO public.task_types (name, label, color) VALUES
  ('one_time', 'Pontual', '#6366f1'),
  ('daily', 'Diária', '#22c55e');
