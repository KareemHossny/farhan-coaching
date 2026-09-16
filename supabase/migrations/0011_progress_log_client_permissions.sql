-- Corrective migration for progress submission permissions.
-- Do not modify or reapply 0009/0010. RLS remains the data boundary.

grant select, insert, update on table public.progress_logs to authenticated;

-- The client-facing clients table is intentionally not directly readable.
-- Use a narrow security-definer predicate so RLS on clients does not make
-- the progress policy reject every otherwise valid client submission.
create or replace function public.can_submit_progress(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_client_id = auth.uid()
    and exists (
      select 1
      from public.clients c
      where c.id = target_client_id
        and c.status = 'active'
        and c.progress_enabled = true
    );
$$;

revoke all on function public.can_submit_progress(uuid) from public;
grant execute on function public.can_submit_progress(uuid) to authenticated;

-- Keep client writes explicitly tied to the authenticated user's own id.
-- These policies are intentionally separate from the older policies so this
-- migration is safe to apply after 0009 and 0010 without rewriting them.
drop policy if exists progress_logs_insert_active_client on public.progress_logs;
create policy progress_logs_insert_active_client
on public.progress_logs for insert to authenticated
with check (
  public.can_submit_progress(client_id)
);

drop policy if exists progress_logs_update_active_client on public.progress_logs;
create policy progress_logs_update_active_client
on public.progress_logs for update to authenticated
using (
  public.can_submit_progress(client_id)
)
with check (
  public.can_submit_progress(client_id)
);
