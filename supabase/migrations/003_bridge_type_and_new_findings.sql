-- Incremental migration: run against an existing project (SQL Editor).
-- Adds implant-retained bridge support. New overlay_type values (bone_graft,
-- soft_tissue_graft, sinus_lift, cyst_removal, biopsy, soft_tissue_lesion,
-- cyst) need no schema change - tooth_overlays.overlay_type has always been
-- a free-form text column.

alter table bridges add column if not exists bridge_type text not null default 'tooth'
  check (bridge_type in ('tooth', 'implant'));

grant all on bridges to anon, authenticated, service_role;
notify pgrst, 'reload schema';
