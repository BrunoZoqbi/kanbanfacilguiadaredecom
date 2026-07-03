-- Rename file_url to file_path on task_attachments.
-- The column now stores the storage object path instead of a fixed-expiry
-- signed URL, since signed URLs are generated on demand when a user opens
-- an attachment.
ALTER TABLE public.task_attachments RENAME COLUMN file_url TO file_path;
