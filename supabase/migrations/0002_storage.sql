-- =============================================================================
-- Klaro — storage buckets + policies
-- documents: PDF/JPEG/PNG, max 10 MB
-- selfies:   JPEG/PNG, max 5 MB
-- bank-statements: raw scraped files, no size/MIME restriction
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png']),
  ('selfies', 'selfies', false, 5242880,
   array['image/jpeg', 'image/png']),
  ('bank-statements', 'bank-statements', false, null, null)
on conflict (id) do nothing;

-- Path convention: <bucket>/<user_id>/<filename>
-- All access scoped to the owning user.

create policy "documents: owner read"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "documents: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "bank-statements: owner read"
  on storage.objects for select
  using (
    bucket_id = 'bank-statements'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "bank-statements: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'bank-statements'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "bank-statements: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'bank-statements'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "selfies: owner read"
  on storage.objects for select
  using (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "selfies: owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "selfies: owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'selfies'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
