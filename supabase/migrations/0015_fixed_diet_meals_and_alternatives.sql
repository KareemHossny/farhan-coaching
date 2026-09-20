-- Fixed daily diet meals and coach-defined food alternatives.
-- Corrective/additive only. Existing plan rows remain unchanged; diet rows
-- written after this migration use day_of_week = 0 because they are not
-- day-specific. Workout rows keep their existing day behavior.

alter table public.plan_items
  add column if not exists alternative_group text;

create index if not exists plan_items_alternative_group_idx
  on public.plan_items(plan_id, meal_label, alternative_group, order_index);

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
        alternative_group text,
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
        plan_id, library_item_id, meal_label, alternative_group, override_grams,
        day_of_week, order_index, name, details,
        override_sets, override_reps, override_calories
      ) values (
        saved_plan_id,
        item.library_item_id,
        case when plan_kind = 'diet' then nullif(trim(item.meal_label), '') else null end,
        case when plan_kind = 'diet' then nullif(trim(item.alternative_group), '') else null end,
        case when plan_kind = 'diet' then item.override_grams else null end,
        case when plan_kind = 'diet' then 0 else item.day_of_week end,
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

drop function if exists public.get_client_plan_items();
create function public.get_client_plan_items()
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
  alternative_group text,
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
    pi.alternative_group,
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
