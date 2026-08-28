-- ONE-TIME CLEANUP - not a schema migration, do not move into
-- supabase/migrations/ or run as part of normal deploys.
--
-- Fixes bug: addKanbanProcedure used to draw a proposed bridge's chart
-- graphic (bridges + bridge_teeth rows) BEFORE checking that its abutment/
-- pontic ADA codes had a published fee on file. If that check then failed
-- (e.g. testing a new code before adding it to Procedures), the bridge was
-- already committed with no treatment_plan_items behind it - visible on the
-- proposed odontogram, but absent from "procedures scheduled" and
-- unreachable from the kanban (nothing there to click "remove" on). The
-- code path itself is now fixed to validate first; this just cleans up any
-- bridge that already got left behind that way.
--
-- Only touches PROPOSED-layer bridges with zero matching treatment_plan_items
-- rows (chart_key like 'bridge-<id>-%'). Existing-layer bridges never have
-- treatment_plan_items to begin with (they're charted directly, not through
-- the kanban), so they're correctly left untouched.

delete from bridges b
where b.layer = 'proposed'
  and not exists (
    select 1 from treatment_plan_items tpi
    where tpi.chart_key like 'bridge-' || b.id || '-%'
  );

-- bridge_teeth rows for the deleted bridges cascade automatically
-- (bridge_teeth.bridge_id references bridges(id) on delete cascade).
