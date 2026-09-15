-- Phase 6: private progress-photo storage bucket and ownership policies.
-- Review before applying after 0001_initial_schema.sql.

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy progress_photos_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy progress_photos_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy progress_photos_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'progress-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
