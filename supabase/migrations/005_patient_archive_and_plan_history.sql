-- Incremental migration: run against an existing project (SQL Editor).
-- Adds soft-delete for patients and a one-active-plan-per-patient model for
-- treatment plans (archived_at marks a plan as historical instead of
-- deleting it, so old plans stay visible read-only).

alter table patients add column if not exists archived_at timestamptz;

alter table treatment_plans add column if not exists archived_at timestamptz;
create index if not exists treatment_plans_patient_id_idx on treatment_plans(patient_id);

-- Backfill: a patient may already have more than one treatment_plans row
-- (all with archived_at null) if a second plan was ever created before this
-- migration. Keep only the newest as active so the unique index below can
-- be added safely.
with ranked as (
  select id, row_number() over (partition by patient_id order by created_at desc) as rn
  from treatment_plans
)
update treatment_plans tp
set archived_at = tp.created_at
from ranked
where ranked.id = tp.id and ranked.rn > 1;

-- Enforce at most one active (non-archived) plan per patient.
create unique index if not exists treatment_plans_one_active_per_patient
  on treatment_plans (patient_id)
  where archived_at is null;

comment on column patients.archived_at is
  'Soft-delete marker. Set when a patient is "deleted" from the UI - nothing is removed, '
  'the patient is just hidden from the default list and can be restored.';

comment on column treatment_plans.archived_at is
  'Set when this plan is replaced by a new one (see archiveActivePlan). Exactly one plan '
  'per patient has archived_at null at any time - that is "the" active plan.';

grant all on patients to anon, authenticated, service_role;
grant all on treatment_plans to anon, authenticated, service_role;
notify pgrst, 'reload schema';
