-- I4: Enforce one role per user. No users currently have 2+ roles
-- (verified before applying), so this constraint is safe to add.
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
