-- C2: Replace hardcoded admin email with system_configs lookup.
-- Insert the initial admin_emails list if not present.
INSERT INTO public.system_configs (key, value)
VALUES ('admin_emails', 'brunozoqbi@gmail.com,lopesramilson@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- Update the signup trigger to read admin_emails from system_configs
-- instead of comparing against a hardcoded literal.
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email      TEXT;
  admin_emails    TEXT;
  admin_list      TEXT[];
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  SELECT value INTO admin_emails
  FROM public.system_configs
  WHERE key = 'admin_emails';

  admin_list := string_to_array(COALESCE(admin_emails, ''), ',');

  IF user_email = ANY(admin_list) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
