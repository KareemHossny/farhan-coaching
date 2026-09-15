-- Phase 4: atomic onboarding and plan writes.
-- Corrective only. Do not apply without a verified production backup.

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
  values (p_client_id, p_coach_id, 'pending', nullif(trim(p_goal), ''));
end;
$$;

revoke all on function public.create_client_record(uuid, uuid, text, text, text) from public;
grant execute on function public.create_client_record(uuid, uuid, text, text, text) to service_role;

create or replace function public.save_client_plans(
  p_client_id uuid,
  p_workout jsonb,
  p_diet jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_coach uuid := auth.uid();
  plan_payload jsonb;
  plan_kind public.plan_type;
  requested_plan_id uuid;
  saved_plan_id uuid;
  item record;
begin
  if current_coach is null or not public.is_coach_profile(current_coach) then
    raise exception 'coach authentication is required';
  end if;

  if not exists (
    select 1 from public.clients c
    where c.id = p_client_id and c.coach_id = current_coach
  ) then
    raise exception 'client does not belong to the authenticated coach';
  end if;

  for plan_kind, plan_payload in
    select 'workout'::public.plan_type, coalesce(p_workout, '{}'::jsonb)
    union all
    select 'diet'::public.plan_type, coalesce(p_diet, '{}'::jsonb)
  loop
    requested_plan_id := nullif(plan_payload ->> 'id', '')::uuid;

    if requested_plan_id is not null then
      update public.plans
      set title = coalesce(nullif(trim(plan_payload ->> 'title'), ''), case when plan_kind = 'workout' then 'خطة التمرين' else 'خطة التغذية' end),
          start_date = nullif(plan_payload ->> 'start_date', '')::date,
          end_date = nullif(plan_payload ->> 'end_date', '')::date
      where id = requested_plan_id
        and client_id = p_client_id
        and coach_id = current_coach
        and type = plan_kind
      returning id into saved_plan_id;

      if saved_plan_id is null then
        raise exception 'requested plan does not belong to the authenticated coach';
      end if;
    else
      insert into public.plans (client_id, coach_id, type, title, start_date, end_date)
      values (
        p_client_id,
        current_coach,
        plan_kind,
        coalesce(nullif(trim(plan_payload ->> 'title'), ''), case when plan_kind = 'workout' then 'خطة التمرين' else 'خطة التغذية' end),
        nullif(plan_payload ->> 'start_date', '')::date,
        nullif(plan_payload ->> 'end_date', '')::date
      )
      returning id into saved_plan_id;
    end if;

    delete from public.plan_items where plan_id = saved_plan_id;

    for item in
      select * from jsonb_to_recordset(coalesce(plan_payload -> 'items', '[]'::jsonb)) as x(
        library_item_id uuid,
        meal_label text,
        override_grams numeric,
        day_of_week smallint,
        order_index integer,
        name text,
        override_sets integer,
        override_reps text,
        override_calories integer,
        details jsonb
      )
    loop
      insert into public.plan_items (
        plan_id, library_item_id, meal_label, override_grams,
        day_of_week, order_index, name, details,
        override_sets, override_reps, override_calories
      ) values (
        saved_plan_id,
        item.library_item_id,
        case when plan_kind = 'diet' then nullif(trim(item.meal_label), '') else null end,
        case when plan_kind = 'diet' then item.override_grams else null end,
        item.day_of_week,
        item.order_index,
        nullif(trim(item.name), ''),
        case when plan_kind = 'workout' then coalesce(item.details, '{}'::jsonb) else '{}'::jsonb end,
        case when plan_kind = 'workout' then item.override_sets else null end,
        case when plan_kind = 'workout' then item.override_reps else null end,
        case when plan_kind = 'diet' then item.override_calories else null end
      );
    end loop;
  end loop;
end;
$$;

revoke all on function public.save_client_plans(uuid, jsonb, jsonb) from public;
grant execute on function public.save_client_plans(uuid, jsonb, jsonb) to authenticated;
