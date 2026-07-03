-- Fix 1: Restrict profiles table - users should only see their own profile or admins see all
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles
FOR SELECT
USING ((id = auth.uid()) OR is_admin());

-- Fix 2: Make storage bucket private and add SELECT policy
UPDATE storage.buckets
SET public = false
WHERE id = 'task-attachments';

-- Add SELECT policy for authenticated access to attachments
CREATE POLICY "Users can view attachments on accessible tasks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (
    -- Check if user has access to the task this attachment belongs to
    EXISTS (
      SELECT 1 FROM public.task_attachments ta
      JOIN public.tasks t ON t.id = ta.task_id
      WHERE storage.objects.name LIKE '%' || ta.id::text || '%'
      AND (t.assignee_id = auth.uid() OR t.created_by_id = auth.uid() OR is_admin())
    )
    -- Or if the user uploaded the file (path starts with user_id)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Fix 3: Replace hardcoded admin names with email-based whitelist
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email from auth.users for this profile
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Check against email whitelist instead of name matching
  IF user_email IN ('bruno@fibrontec.com', 'ramilson@fibrontec.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- All other users get the 'user' role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
