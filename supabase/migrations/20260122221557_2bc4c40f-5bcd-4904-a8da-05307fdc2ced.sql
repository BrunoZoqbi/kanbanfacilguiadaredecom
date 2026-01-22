-- Create a trigger function to automatically assign roles based on user name
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user should be an admin based on their full_name
  IF NEW.full_name ILIKE '%Bruno Zoqbi%' OR 
     NEW.full_name ILIKE '%Ramilson%' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to assign role when profile is created
CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role_on_signup();