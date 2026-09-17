-- New client accounts created by the coach are active by default.
-- Corrective only: existing client statuses and production data are unchanged.

create or replace function public.create_client_record(
  p_client_id uuid,
  p_coach_id uuid,
  p_full_name text,
  p_phone text,
  p_goal text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_coach_profile(p_coach_id) then
    raise exception 'coach profile is invalid';
  end if;

  if not exists (select 1 from auth.users where id = p_client_id) then
    raise exception 'auth user does not exist';
  end if;

  insert into public.profiles (id, full_name, role, phone)
  values (p_client_id, nullif(trim(p_full_name), ''), 'client', nullif(trim(p_phone), ''));

  insert into public.clients (id, coach_id, status, goal)
  values (p_client_id, p_coach_id, 'active', nullif(trim(p_goal), ''));
end;
$$;

revoke all on function public.create_client_record(uuid, uuid, text, text, text) from public;
grant execute on function public.create_client_record(uuid, uuid, text, text, text) to service_role;
