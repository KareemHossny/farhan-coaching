-- Egyptian Fitness Coach Platform
-- Phase 1: initial schema and Row Level Security
-- Review this migration before applying it to Supabase.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('coach', 'client');
create type public.client_status as enum ('active', 'paused', 'pending');
create type public.plan_type as enum ('workout', 'diet');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key references public.profiles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete restrict,
  status public.client_status not null default 'pending',
  goal text,
  height_cm numeric(5, 2) check (height_cm is null or height_cm > 0),
  starting_weight_kg numeric(6, 2) check (starting_weight_kg is null or starting_weight_kg > 0),
  notes text
);

create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  muscle_group text,
  youtube_url text,
  default_sets integer check (default_sets is null or default_sets > 0),
  default_reps text,
  default_rest_seconds integer check (default_rest_seconds is null or default_rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.meal_library (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  calories integer check (calories is null or calories >= 0),
  protein_g numeric(7, 2) check (protein_g is null or protein_g >= 0),
  carbs_g numeric(7, 2) check (carbs_g is null or carbs_g >= 0),
  fats_g numeric(7, 2) check (fats_g is null or fats_g >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete restrict,
  type public.plan_type not null,
  title text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  order_index integer not null default 0 check (order_index >= 0),
  -- Polymorphic reference: exercise_library for workout plans or meal_library
  -- for diet plans. It is intentionally not a database-level foreign key.
  library_item_id uuid,
  meal_label text,
  override_sets integer check (override_sets is null or override_sets > 0),
  override_reps text,
  override_calories integer check (override_calories is null or override_calories >= 0),
  override_grams numeric(8, 2) check (override_grams is null or override_grams > 0),
  name text,
  details jsonb not null default '{}'::jsonb
);

create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null default current_date,
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  photo_url text,
  note text,
  unique (client_id, date)
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  message text,
  created_at timestamptz not null default now(),
  contacted boolean not null default false
);

create index clients_coach_id_idx on public.clients (coach_id);
create index exercise_library_coach_id_idx on public.exercise_library (coach_id);
create index meal_library_coach_id_idx on public.meal_library (coach_id);
create index plans_client_id_idx on public.plans (client_id);
create index plans_coach_id_idx on public.plans (coach_id);
create index plan_items_plan_day_order_idx on public.plan_items (plan_id, day_of_week, order_index);
create index plan_items_library_item_id_idx on public.plan_items (library_item_id);
create index progress_logs_client_date_idx on public.progress_logs (client_id, date desc);
create index leads_contacted_created_at_idx on public.leads (contacted, created_at desc);

-- These helpers run with the owner's privileges and are used only for RLS
-- predicates, avoiding recursive reads through profiles policies.
create or replace function public.is_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_assigned_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients
    where id = target_client_id and id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.exercise_library enable row level security;
alter table public.meal_library enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.progress_logs enable row level security;
alter table public.leads enable row level security;

-- Profiles: users can see their own profile; coaches can see profiles of their
-- assigned clients so dashboard joins can display client names.
create policy profiles_select_self_or_assigned_coach
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or (
    public.is_coach()
    and exists (
      select 1 from public.clients c
      where c.id = profiles.id and c.coach_id = auth.uid()
    )
  )
);

create policy profiles_update_self
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

-- Clients: a client sees only their own row. A coach has access only to their
-- own client rows and cannot assign a row to another coach.
create policy clients_select_own_or_coach
on public.clients for select to authenticated
using (id = auth.uid() or (public.is_coach() and coach_id = auth.uid()));

create policy clients_insert_coach_owned
on public.clients for insert to authenticated
with check (public.is_coach() and coach_id = auth.uid());

create policy clients_update_coach_owned
on public.clients for update to authenticated
using (public.is_coach() and coach_id = auth.uid())
with check (public.is_coach() and coach_id = auth.uid());

-- Libraries: coaches have full CRUD over their own rows. Clients can read the
-- library belonging to their assigned coach (for names/videos in their plan).
create policy exercise_library_select_own_or_client_coach
on public.exercise_library for select to authenticated
using (
  (public.is_coach() and coach_id = auth.uid())
  or exists (
    select 1 from public.clients c
    where c.id = auth.uid() and c.coach_id = exercise_library.coach_id
  )
);

create policy exercise_library_insert_own
on public.exercise_library for insert to authenticated
with check (public.is_coach() and coach_id = auth.uid());

create policy exercise_library_update_own
on public.exercise_library for update to authenticated
using (public.is_coach() and coach_id = auth.uid())
with check (public.is_coach() and coach_id = auth.uid());

create policy exercise_library_delete_own
on public.exercise_library for delete to authenticated
using (public.is_coach() and coach_id = auth.uid());

create policy meal_library_select_own_or_client_coach
on public.meal_library for select to authenticated
using (
  (public.is_coach() and coach_id = auth.uid())
  or exists (
    select 1 from public.clients c
    where c.id = auth.uid() and c.coach_id = meal_library.coach_id
  )
);

create policy meal_library_insert_own
on public.meal_library for insert to authenticated
with check (public.is_coach() and coach_id = auth.uid());

create policy meal_library_update_own
on public.meal_library for update to authenticated
using (public.is_coach() and coach_id = auth.uid())
with check (public.is_coach() and coach_id = auth.uid());

create policy meal_library_delete_own
on public.meal_library for delete to authenticated
using (public.is_coach() and coach_id = auth.uid());

-- Plans: clients have read-only access to plans assigned to themselves;
-- coaches have full plan management within their own client relationship.
create policy plans_select_own_or_coach
on public.plans for select to authenticated
using (
  public.is_assigned_client(client_id)
  or (public.is_coach() and coach_id = auth.uid())
);

create policy plans_insert_coach_owned
on public.plans for insert to authenticated
with check (
  public.is_coach()
  and coach_id = auth.uid()
  and exists (select 1 from public.clients c where c.id = client_id and c.coach_id = auth.uid())
);

create policy plans_update_coach_owned
on public.plans for update to authenticated
using (public.is_coach() and coach_id = auth.uid())
with check (
  public.is_coach()
  and coach_id = auth.uid()
  and exists (select 1 from public.clients c where c.id = client_id and c.coach_id = auth.uid())
);

create policy plans_delete_coach_owned
on public.plans for delete to authenticated
using (public.is_coach() and coach_id = auth.uid());

-- Plan items inherit ownership from their parent plan.
create policy plan_items_select_own_or_coach
on public.plan_items for select to authenticated
using (
  exists (
    select 1 from public.plans p
    where p.id = plan_items.plan_id
      and (public.is_assigned_client(p.client_id) or (public.is_coach() and p.coach_id = auth.uid()))
  )
);

create policy plan_items_insert_coach_owned
on public.plan_items for insert to authenticated
with check (
  public.is_coach()
  and exists (select 1 from public.plans p where p.id = plan_id and p.coach_id = auth.uid())
);

create policy plan_items_update_coach_owned
on public.plan_items for update to authenticated
using (
  public.is_coach()
  and exists (select 1 from public.plans p where p.id = plan_items.plan_id and p.coach_id = auth.uid())
)
with check (
  public.is_coach()
  and exists (select 1 from public.plans p where p.id = plan_id and p.coach_id = auth.uid())
);

create policy plan_items_delete_coach_owned
on public.plan_items for delete to authenticated
using (
  public.is_coach()
  and exists (select 1 from public.plans p where p.id = plan_items.plan_id and p.coach_id = auth.uid())
);

-- Progress: clients can read and create only their own logs. Coaches can read
-- and update logs belonging to their assigned clients.
create policy progress_logs_select_own_or_coach
on public.progress_logs for select to authenticated
using (
  public.is_assigned_client(client_id)
  or (public.is_coach() and exists (select 1 from public.clients c where c.id = client_id and c.coach_id = auth.uid()))
);

create policy progress_logs_insert_own
on public.progress_logs for insert to authenticated
with check (public.is_assigned_client(client_id));

create policy progress_logs_update_coach_owned
on public.progress_logs for update to authenticated
using (public.is_coach() and exists (select 1 from public.clients c where c.id = progress_logs.client_id and c.coach_id = auth.uid()))
with check (public.is_coach() and exists (select 1 from public.clients c where c.id = client_id and c.coach_id = auth.uid()));

-- Leads: the public landing form can insert but nobody anonymous can read.
-- Only a coach can read/update leads.
create policy leads_public_insert
on public.leads for insert to anon, authenticated
with check (contacted = false);

create policy leads_coach_select
on public.leads for select to authenticated
using (public.is_coach());

create policy leads_coach_update
on public.leads for update to authenticated
using (public.is_coach())
with check (public.is_coach());
