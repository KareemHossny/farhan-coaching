-- Phase 10: meal grouping and client-visible gram quantities.
-- Review before applying after the previous migrations.

alter table public.plan_items add column if not exists meal_label text;
alter table public.plan_items add column if not exists override_grams numeric(8, 2);
alter table public.plan_items add constraint plan_items_override_grams_positive
  check (override_grams is null or override_grams > 0);
create index if not exists plan_items_meal_label_idx on public.plan_items(plan_id, day_of_week, meal_label, order_index);
