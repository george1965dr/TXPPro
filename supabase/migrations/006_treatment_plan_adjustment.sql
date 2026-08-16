-- Incremental migration: run against an existing project (SQL Editor).
-- Adds a flat, editable reduction (professional courtesy, loyalty discount,
-- etc.) applied when presenting a plan to the patient - always subtracted
-- from the itemized subtotal, never itself negative.

alter table treatment_plans add column if not exists adjustment numeric(10,2) not null default 0;

comment on column treatment_plans.adjustment is
  'Flat amount subtracted from the itemized subtotal when presenting this plan to the patient - '
  'professional courtesy, loyalty discount, etc. Never negative; displayed grand total is clamped at $0.';

grant all on treatment_plans to anon, authenticated, service_role;
notify pgrst, 'reload schema';
