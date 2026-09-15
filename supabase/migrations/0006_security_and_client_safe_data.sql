-- Phase 3: security hardening and client-safe plan reads.
-- This migration is corrective only. It does not delete, recreate, or seed data.
-- Review and apply it to the existing Supabase project after taking a backup.

create or replace function public.is_client_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id and role = 'client'
  );
$$;

create or replace function public.is_coach_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id and role = 'coach'
  );
$$;

revoke all on function public.is_client_profile(uuid) from public;
revoke all on function public.is_coach_profile(uuid) from public;
grant execute on function public.is_client_profile(uuid) to authenticated;
grant execute on function public.is_coach_profile(uuid) to authenticated;

create or replace function public.validate_client_relationship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_client_profile(new.id) then
    raise exception 'clients.id must reference a client profile';
  end if;

  if not public.is_coach_profile(new.coach_id) then
    raise exception 'clients.coach_id must reference a coach profile';
  end if;

  if tg_op = 'UPDATE' and (new.id <> old.id or new.coach_id <> old.coach_id) then
    raise exception 'client identity and coach assignment cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_client_relationship on public.clients;
create trigger validate_client_relationship
before insert or update on public.clients
for each row execute function public.validate_client_relationship();

create or replace function public.validate_plan_relationship()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.clients c
    where c.id = new.client_id and c.coach_id = new.coach_id
  ) then
    raise exception 'plan client and coach relationship is invalid';
  end if;

  if tg_op = 'UPDATE' and (new.client_id <> old.client_id or new.coach_id <> old.coach_id or new.type <> old.type) then
    raise exception 'plan ownership and type cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_plan_relationship on public.plans;
create trigger validate_plan_relationship
before insert or update on public.plans
for each row execute function public.validate_plan_relationship();

create or replace function public.validate_plan_item_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent public.plans%rowtype;
begin
  select * into parent from public.plans where id = new.plan_id;
  if not found then
    raise exception 'plan item parent plan does not exist';
  end if;

  if new.day_of_week < 0 or new.day_of_week > 6 then
    raise exception 'day_of_week must be between 0 and 6';
  end if;

  if parent.type = 'workout' then
    if new.meal_label is not null or new.override_grams is not null then
      raise exception 'diet-only fields cannot be used on workout items';
    end if;
    if new.library_item_id is not null and not exists (
      select 1 from public.exercise_library e
      where e.id = new.library_item_id and e.coach_id = parent.coach_id
    ) then
      raise exception 'workout item must reference an exercise owned by the plan coach';
    end if;
  else
    if new.override_grams is null or new.override_grams <= 0 then
      raise exception 'diet items require positive grams';
    end if;
    if nullif(trim(new.meal_label), '') is null then
      raise exception 'diet items require a meal label';
    end if;
    if new.library_item_id is not null and not exists (
      select 1 from public.meal_library m
      where m.id = new.library_item_id and m.coach_id = parent.coach_id
    ) then
      raise exception 'diet item must reference a meal owned by the plan coach';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_plan_item_reference on public.plan_items;
create trigger validate_plan_item_reference
before insert or update on public.plan_items
for each row execute function public.validate_plan_item_reference();

drop policy if exists clients_insert_coach_owned on public.clients;
create policy clients_insert_coach_owned
on public.clients for insert to authenticated
with check (
  public.is_coach()
  and coach_id = auth.uid()
  and public.is_client_profile(id)
);

drop policy if exists clients_update_coach_owned on public.clients;
create policy clients_update_coach_owned
on public.clients for update to authenticated
using (public.is_coach() and coach_id = auth.uid())
with check (
  public.is_coach()
  and coach_id = auth.uid()
  and public.is_client_profile(id)
);

-- Client pages use the safe account function below. Direct table reads would
-- expose coach-only notes, so clients no longer receive a clients row.
drop policy if exists clients_select_own_or_coach on public.clients;
create policy clients_select_coach_owned
on public.clients for select to authenticated
using (public.is_coach() and coach_id = auth.uid());

drop policy if exists plans_select_own_or_coach on public.plans;
create policy plans_select_coach_owned
on public.plans for select to authenticated
using (public.is_coach() and coach_id = auth.uid());

drop policy if exists plan_items_select_own_or_coach on public.plan_items;
create policy plan_items_select_coach_owned
on public.plan_items for select to authenticated
using (exists (select 1 from public.plans p where p.id = plan_items.plan_id and p.coach_id = auth.uid()));

-- Clients use the safe RPC below instead of reading library tables directly.
drop policy if exists exercise_library_select_own_or_client_coach on public.exercise_library;
create policy exercise_library_select_coach_only
on public.exercise_library for select to authenticated
using (public.is_coach() and coach_id = auth.uid());

drop policy if exists meal_library_select_own_or_client_coach on public.meal_library;
create policy meal_library_select_coach_only
on public.meal_library for select to authenticated
using (public.is_coach() and coach_id = auth.uid());

create or replace function public.get_client_plan_items()
returns table (
  plan_id uuid,
  client_id uuid,
  plan_type public.plan_type,
  plan_title text,
  start_date date,
  end_date date,
  item_id uuid,
  day_of_week smallint,
  order_index integer,
  library_item_id uuid,
  meal_label text,
  item_name text,
  grams numeric,
  sets integer,
  reps text,
  rest_seconds integer,
  youtube_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.client_id,
    p.type,
    p.title,
    p.start_date,
    p.end_date,
    pi.id,
    pi.day_of_week,
    pi.order_index,
    pi.library_item_id,
    pi.meal_label,
    coalesce(e.name, pi.name),
    pi.override_grams,
    pi.override_sets,
    pi.override_reps,
    case
      when pi.details ->> 'rest_seconds' ~ '^[0-9]+$'
      then (pi.details ->> 'rest_seconds')::integer
      else null
    end,
    e.youtube_url
  from public.plans p
  join public.plan_items pi on pi.plan_id = p.id
  left join public.exercise_library e
    on p.type = 'workout'
    and e.id = pi.library_item_id
    and e.coach_id = p.coach_id
  where p.client_id = auth.uid();
$$;

revoke all on function public.get_client_plan_items() from public;
grant execute on function public.get_client_plan_items() to authenticated;

create or replace function public.get_client_account()
returns table (id uuid, status public.client_status, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.status, p.full_name
  from public.clients c
  join public.profiles p on p.id = c.id and p.role = 'client'
  where c.id = auth.uid();
$$;

revoke all on function public.get_client_account() from public;
grant execute on function public.get_client_account() to authenticated;

drop policy if exists progress_photos_select_assigned_coach on storage.objects;
create policy progress_photos_select_assigned_coach
on storage.objects for select to authenticated
using (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from public.clients c
    where c.id::text = (storage.foldername(name))[1]
      and c.coach_id = auth.uid()
  )
);
