-- ============================================================================
-- ONE-TIME DATA RESET — this is NOT a schema migration. Do not move this
-- into supabase/migrations/ or run it as part of normal deploys.
--
-- Deletes every patient, treatment plan, odontogram entry (existing +
-- proposed conditions, overlays, bridges), perio measurement, and
-- photo/video, plus the entire procedure/fee-code list - so the practice
-- can start clean and add its own codes.
--
-- Left untouched: auth.users (login), and practice_settings (practice name
-- + address).
--
-- THERE IS NO UNDO. Run this once, deliberately, in the Supabase SQL Editor.
-- ============================================================================

-- sequenced_treatment_plan_items has one cascading FK (to
-- sequenced_treatment_plans) and one non-cascading FK (to
-- treatment_plan_items). Deleting patients cascades down both branches of
-- that diamond at once, and Postgres doesn't guarantee it clears this table
-- before touching treatment_plan_items on the other branch - so clear it
-- explicitly first to remove the ambiguity.
delete from sequenced_treatment_plan_items;

-- Cascades (via "on delete cascade" foreign keys) through:
--   treatment_plans, treatment_plan_items, sequenced_treatment_plans,
--   tooth_conditions, tooth_overlays, bridges, bridge_teeth,
--   periodontal_measurements, tooth_perio_status, patient_media
-- in a single statement.
delete from patients;

-- Safe now that no treatment_plan_items reference them.
delete from procedures;

-- Remove the uploaded photo/video file records for the deleted patients.
delete from storage.objects where bucket_id = 'patient-media';

-- practice_settings (id, name, address) is intentionally left alone.
