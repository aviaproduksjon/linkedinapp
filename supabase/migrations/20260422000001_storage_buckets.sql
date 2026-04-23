-- =============================================================================
-- Create storage buckets (idempotent).
-- =============================================================================
--
-- These are declared in supabase/config.toml for local dev, but the cloud
-- project needs them explicitly via storage.buckets insert.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 25 * 1024 * 1024,
  array['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']::text[])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']::text[])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
