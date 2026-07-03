-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create task priority enum
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create task type enum
CREATE TYPE public.task_type AS ENUM ('daily', 'one_time');

-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('todo', 'doing', 'done');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  task_type task_type NOT NULL DEFAULT 'one_time',
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  location TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create task_tags junction table
CREATE TABLE public.task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (task_id, tag_id)
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create task_checklist_items table
CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- User roles policies (only admins can manage, users can view own)
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin());

-- Tags policies (everyone can view, admins can manage)
CREATE POLICY "Everyone can view tags" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL TO authenticated USING (public.is_admin());

-- Tasks policies
CREATE POLICY "Users can view own tasks or admins see all" ON public.tasks
  FOR SELECT TO authenticated
  USING (assignee_id = auth.uid() OR created_by_id = auth.uid() OR public.is_admin());

CREATE POLICY "Authenticated users can create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "Users can update own tasks or admins update all" ON public.tasks
  FOR UPDATE TO authenticated
  USING (assignee_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (public.is_admin());

-- Task tags policies
CREATE POLICY "Users can view task tags" ON public.task_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage task tags for accessible tasks" ON public.task_tags
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_tags.task_id
    AND (tasks.assignee_id = auth.uid() OR public.is_admin())
  ));

-- Task comments policies
CREATE POLICY "Users can view comments on accessible tasks" ON public.task_comments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_comments.task_id
    AND (tasks.assignee_id = auth.uid() OR tasks.created_by_id = auth.uid() OR public.is_admin())
  ));

CREATE POLICY "Users can create comments on accessible tasks" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_comments.task_id
    AND (tasks.assignee_id = auth.uid() OR tasks.created_by_id = auth.uid() OR public.is_admin())
  ));

-- Task checklist policies
CREATE POLICY "Users can view checklists on accessible tasks" ON public.task_checklist_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_checklist_items.task_id
    AND (tasks.assignee_id = auth.uid() OR tasks.created_by_id = auth.uid() OR public.is_admin())
  ));

CREATE POLICY "Users can manage checklists on own tasks" ON public.task_checklist_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_checklist_items.task_id
    AND (tasks.assignee_id = auth.uid() OR public.is_admin())
  ));

-- Task attachments policies
CREATE POLICY "Users can view attachments on accessible tasks" ON public.task_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_attachments.task_id
    AND (tasks.assignee_id = auth.uid() OR tasks.created_by_id = auth.uid() OR public.is_admin())
  ));

CREATE POLICY "Users can manage attachments on own tasks" ON public.task_attachments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_attachments.task_id
    AND (tasks.assignee_id = auth.uid() OR public.is_admin())
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-set completed_at when task moves to done
CREATE OR REPLACE FUNCTION public.handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER handle_task_completion_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_task_completion();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default tags
INSERT INTO public.tags (name, color) VALUES
  ('CTO', '#ef4444'),
  ('Rede', '#3b82f6'),
  ('Cliente', '#22c55e'),
  ('Manutenção', '#f59e0b'),
  ('Administrativo', '#8b5cf6'),
  ('Urgente', '#dc2626');

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
