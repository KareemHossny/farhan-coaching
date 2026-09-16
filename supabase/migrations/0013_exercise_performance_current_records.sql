-- One current strength record per assigned exercise type.
-- This is additive and does not alter data in 0012's historical log table.

create table if not exists public.exercise_performance_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_item_id uuid references public.plan_items (id) on delete set null,
  exercise_key text not null,
  exercise_name text not null,
  max_weight_kg numeric(7, 2) not null check (max_weight_kg >= 0 and max_weight_kg <= 1000),
  max_reps integer not null check (max_reps > 0 and max_reps <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, exercise_key)
);

create index if not exists exercise_performance_records_client_idx
  on public.exercise_performance_records (client_id, updated_at desc);

alter table public.exercise_performance_records enable row level security;

create or replace function public.can_write_exercise_performance_record(
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

create or replace function public.can_coach_read_exercise_performance_record(target_client_id uuid)
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

revoke all on function public.can_write_exercise_performance_record(uuid, uuid) from public;
revoke all on function public.can_coach_read_exercise_performance_record(uuid) from public;
grant execute on function public.can_write_exercise_performance_record(uuid, uuid) to authenticated;
grant execute on function public.can_coach_read_exercise_performance_record(uuid) to authenticated;

create or replace function public.set_exercise_performance_record_details()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_name text;
  expected_key text;
begin
  select
    coalesce(e.name, pi.name),
    case
      when pi.library_item_id is not null then 'library:' || pi.library_item_id::text
      else 'custom:' || lower(trim(coalesce(pi.name, '')))
    end
  into expected_name, expected_key
  from public.plan_items pi
  join public.plans p on p.id = pi.plan_id and p.client_id = new.client_id and p.type = 'workout'
  left join public.exercise_library e on e.id = pi.library_item_id and e.coach_id = p.coach_id
  where pi.id = new.plan_item_id;

  if expected_name is null or nullif(trim(expected_name), '') is null then
    raise exception 'exercise performance must reference an assigned workout exercise';
  end if;

  new.exercise_name := expected_name;
  new.exercise_key := expected_key;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_exercise_performance_record_details on public.exercise_performance_records;
create trigger set_exercise_performance_record_details
before insert or update on public.exercise_performance_records
for each row execute function public.set_exercise_performance_record_details();

drop policy if exists exercise_performance_records_select_own_or_coach on public.exercise_performance_records;
create policy exercise_performance_records_select_own_or_coach
on public.exercise_performance_records for select to authenticated
using (
  client_id = auth.uid()
  or public.can_coach_read_exercise_performance_record(client_id)
);

drop policy if exists exercise_performance_records_insert_own on public.exercise_performance_records;
create policy exercise_performance_records_insert_own
on public.exercise_performance_records for insert to authenticated
with check (public.can_write_exercise_performance_record(client_id, plan_item_id));

drop policy if exists exercise_performance_records_update_own on public.exercise_performance_records;
create policy exercise_performance_records_update_own
on public.exercise_performance_records for update to authenticated
using (client_id = auth.uid())
with check (public.can_write_exercise_performance_record(client_id, plan_item_id));

grant select, insert, update on table public.exercise_performance_records to authenticated;
