-- Incremental migration: run against an existing project (SQL Editor).
-- The kanban (treatment_plan_items) becomes the authority for the treatment
-- plan instead of the odontogram's proposed layer - see chart-key comment
-- below for how the two now relate. Fees must be frozen at the moment a
-- procedure is added, immune to later edits to the master `procedures.fee`,
-- so we snapshot it onto the item itself instead of joining it live.

alter table treatment_plan_items add column if not exists fee numeric(10, 2);

update treatment_plan_items tpi
set fee = p.fee
from procedures p
where tpi.procedure_id = p.id
  and tpi.fee is null;

alter table treatment_plan_items alter column fee set not null;

comment on column treatment_plan_items.chart_key is
  'Links this item to its drawn proposed-layer chart graphic (tooth_conditions/tooth_overlays/bridges). '
  'Set by the kanban-add action, which is now the source of truth - it writes the plan item and the '
  'chart graphic together. Null for tooth-less items (e.g. a cleaning) with nothing to draw.';

grant all on treatment_plan_items to anon, authenticated, service_role;
notify pgrst, 'reload schema';
