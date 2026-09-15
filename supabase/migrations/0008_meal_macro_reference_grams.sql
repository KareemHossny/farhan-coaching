-- Store the serving weight that the library macros belong to.
-- Existing meals keep their current values; legacy rows use 100g as the
-- explicit reference until the coach edits them.
alter table public.meal_library
  add column if not exists macro_reference_grams numeric(8, 2);

update public.meal_library
set macro_reference_grams = 100
where macro_reference_grams is null;

alter table public.meal_library
  alter column macro_reference_grams set default 100,
  alter column macro_reference_grams set not null;

alter table public.meal_library
  drop constraint if exists meal_library_macro_reference_grams_positive;

alter table public.meal_library
  add constraint meal_library_macro_reference_grams_positive
  check (macro_reference_grams > 0);
