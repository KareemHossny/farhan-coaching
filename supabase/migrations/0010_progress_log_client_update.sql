-- Allow an active client to replace their own same-day progress entry.
-- This is required because the application uses an upsert to update the
-- weight/photo submitted for the current day.
drop policy if exists progress_logs_update_own on public.progress_logs;
create policy progress_logs_update_own
on public.progress_logs for update to authenticated
using (
  public.is_assigned_client(client_id)
  and exists (
    select 1
    from public.clients c
    where c.id = auth.uid()
      and c.status = 'active'
      and c.progress_enabled = true
  )
)
with check (
  public.is_assigned_client(client_id)
  and exists (
    select 1
    from public.clients c
    where c.id = auth.uid()
      and c.status = 'active'
      and c.progress_enabled = true
  )
);
