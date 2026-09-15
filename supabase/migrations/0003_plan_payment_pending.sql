-- Phase 7: allow the coach to flag an individual plan as awaiting payment.
-- Review before applying after the previous migrations.

alter table public.plans
  add column if not exists payment_pending boolean not null default false;
