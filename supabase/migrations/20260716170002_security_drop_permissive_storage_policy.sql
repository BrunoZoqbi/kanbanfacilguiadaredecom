-- I2: Drop the overly permissive storage policy that lets any authenticated
-- user view any attachment in the task-attachments bucket regardless of
-- task ownership. The narrower "Users can view attachments on accessible tasks"
-- policy already covers legitimate access.
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
