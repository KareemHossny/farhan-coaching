-- Coach-controlled progress submission switch.
-- Safe for existing data: all existing clients remain enabled by default.
alter table public.clients
  add column if not exists progress_enabled boolean not null default true;

-- Keep the rule at the database boundary as well as in the server action.
drop policy if exists progress_logs_insert_own on public.progress_logs;
create policy progress_logs_insert_own
on public.progress_logs for insert to authenticated
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

-- Expose only the account status and the coach's progress-submission switch.
drop function if exists public.get_client_account();
create function public.get_client_account()
returns table (
  id uuid,
  status public.client_status,
  full_name text,
  progress_enabled boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.status, p.full_name, c.progress_enabled
  from public.clients c
  join public.profiles p on p.id = c.id and p.role = 'client'
  where c.id = auth.uid();
$$;

revoke all on function public.get_client_account() from public;
grant execute on function public.get_client_account() to authenticated;
