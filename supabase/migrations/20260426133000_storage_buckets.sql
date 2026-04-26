-- Phase 0 / Dot D: Supabase Storage buckets for avatars and private documents.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('documents', 'documents', false, 20971520, array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain'
  ]),
  ('payslips', 'payslips', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp']),
  ('contracts', 'contracts', false, 20971520, array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

drop policy if exists "BIZOS avatars public read" on storage.objects;
create policy "BIZOS avatars public read"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "BIZOS users read own private storage" on storage.objects;
create policy "BIZOS users read own private storage"
on storage.objects for select to authenticated
using (
  bucket_id in ('documents', 'contracts', 'payslips')
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "BIZOS users write own storage" on storage.objects;
create policy "BIZOS users write own storage"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('avatars', 'documents', 'contracts', 'payslips')
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "BIZOS users update own storage" on storage.objects;
create policy "BIZOS users update own storage"
on storage.objects for update to authenticated
using (
  bucket_id in ('avatars', 'documents', 'contracts', 'payslips')
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id in ('avatars', 'documents', 'contracts', 'payslips')
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "BIZOS users delete own storage" on storage.objects;
create policy "BIZOS users delete own storage"
on storage.objects for delete to authenticated
using (
  bucket_id in ('avatars', 'documents', 'contracts', 'payslips')
  and (storage.foldername(name))[2] = auth.uid()::text
);
