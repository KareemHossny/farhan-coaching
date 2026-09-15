-- Phase 9: exercise/meal libraries.
-- The initial project migration already contains these objects. This
-- idempotent migration documents and hardens the Phase 9 contract.

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, muscle_group text, youtube_url text, default_sets integer,
  default_reps text, default_rest_seconds integer, notes text, created_at timestamptz not null default now()
);
create table if not exists public.meal_library (
  id uuid primary key default gen_random_uuid(), coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, calories integer, protein_g numeric, carbs_g numeric, fats_g numeric,
  notes text, created_at timestamptz not null default now()
);
alter table public.plan_items add column if not exists library_item_id uuid;
alter table public.plan_items add column if not exists override_sets integer;
alter table public.plan_items add column if not exists override_reps text;
alter table public.plan_items add column if not exists override_calories integer;
create index if not exists plan_items_library_item_id_idx on public.plan_items(library_item_id);

alter table public.exercise_library enable row level security;
alter table public.meal_library enable row level security;
drop policy if exists exercise_library_select_own_or_client_coach on public.exercise_library;
create policy exercise_library_select_own_or_client_coach on public.exercise_library for select to authenticated using ((public.is_coach() and coach_id = auth.uid()) or exists (select 1 from public.clients c where c.id = auth.uid() and c.coach_id = exercise_library.coach_id));
drop policy if exists meal_library_select_own_or_client_coach on public.meal_library;
create policy meal_library_select_own_or_client_coach on public.meal_library for select to authenticated using ((public.is_coach() and coach_id = auth.uid()) or exists (select 1 from public.clients c where c.id = auth.uid() and c.coach_id = meal_library.coach_id));
