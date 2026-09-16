-- Daily performance notes for exercises assigned to a client.
-- Corrective/additive only. Existing plans and data are preserved.

create table if not exists public.exercise_performance_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_item_id uuid references public.plan_items (id) on delete set null,
  exercise_name text not null,
  date date not null default current_date,
  max_weight_kg numeric(7, 2) not null check (max_weight_kg >= 0 and max_weight_kg <= 1000),
  max_reps integer not null check (max_reps > 0 and max_reps <= 1000),
  created_at timestamptz not null default now(),
  unique (client_id, plan_item_id, date)
);

create index if not exists exercise_performance_client_date_idx
  on public.exercise_performance_logs (client_id, date desc);

alter table public.exercise_performance_logs enable row level security;

create or replace function public.can_write_exercise_performance(
  target_client_id uuid,
  target_plan_item_id uuid
)
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
    )
    and exists (
      select 1
      from public.plan_items pi
      join public.plans p on p.id = pi.plan_id
      where pi.id = target_plan_item_id
        and p.client_id = target_client_id
        and p.type = 'workout'
    );
$$;

create or replace function public.can_coach_read_exercise_performance(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_coach()
    and exists (
      select 1
      from public.clients c
      where c.id = target_client_id
        and c.coach_id = auth.uid()
    );
$$;

revoke all on function public.can_write_exercise_performance(uuid, uuid) from public;
revoke all on function public.can_coach_read_exercise_performance(uuid) from public;
grant execute on function public.can_write_exercise_performance(uuid, uuid) to authenticated;
grant execute on function public.can_coach_read_exercise_performance(uuid) to authenticated;

drop policy if exists exercise_performance_select_own_or_coach on public.exercise_performance_logs;
create policy exercise_performance_select_own_or_coach
on public.exercise_performance_logs for select to authenticated
using (
  client_id = auth.uid()
  or public.can_coach_read_exercise_performance(client_id)
);

drop policy if exists exercise_performance_insert_own on public.exercise_performance_logs;
create policy exercise_performance_insert_own
on public.exercise_performance_logs for insert to authenticated
with check (public.can_write_exercise_performance(client_id, plan_item_id));

drop policy if exists exercise_performance_update_own on public.exercise_performance_logs;
create policy exercise_performance_update_own
on public.exercise_performance_logs for update to authenticated
using (public.can_write_exercise_performance(client_id, plan_item_id))
with check (public.can_write_exercise_performance(client_id, plan_item_id));

grant select, insert, update on table public.exercise_performance_logs to authenticated;

create or replace function public.set_exercise_performance_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_name text;
begin
  select coalesce(e.name, pi.name)
    into expected_name
  from public.plan_items pi
  join public.plans p on p.id = pi.plan_id and p.client_id = new.client_id and p.type = 'workout'
  left join public.exercise_library e on e.id = pi.library_item_id and e.coach_id = p.coach_id
  where pi.id = new.plan_item_id;

  if expected_name is null or nullif(trim(expected_name), '') is null then
    raise exception 'exercise performance must reference an assigned workout exercise';
  end if;

  new.exercise_name := expected_name;
  return new;
end;
$$;

drop trigger if exists set_exercise_performance_name on public.exercise_performance_logs;
create trigger set_exercise_performance_name
before insert or update on public.exercise_performance_logs
for each row execute function public.set_exercise_performance_name();
