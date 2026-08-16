-- Incremental migration: run this against an existing project (SQL Editor).
-- Adds root canal / periapical / implant / bridge support to the odontogram.
-- schema.sql already has this folded in for fresh installs - this file is
-- for databases that were set up before this change existed.

-- Non-exclusive whole-tooth flags: unlike tooth_conditions (one value per
-- surface slot), a tooth can carry any combination of these at once - a
-- molar can have a crown AND a root canal AND a periapical lesion
-- simultaneously. Separate table so toggling one never collides with or
-- overwrites another.
create table tooth_overlays (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number integer not null check (tooth_number >= 1 and tooth_number <= 32),
  layer text not null check (layer in ('existing', 'proposed')),
  overlay_type text not null, -- 'root_canal' | 'retreatment' | 'apicoectomy' | 'periapical_lesion' | 'fracture' | 'impacted' | 'watch'
  notes text,
  created_at timestamptz not null default now(),
  unique (patient_id, tooth_number, layer, overlay_type)
);

create index idx_tooth_overlays_patient on tooth_overlays(patient_id, tooth_number);

-- Bridges span multiple teeth as one clinical unit (abutments + pontics),
-- which doesn't fit a single-tooth table. "Pontic" is derived from
-- bridge_teeth membership, not stored as a tooth_conditions value - one
-- source of truth instead of two tables that can drift apart.
create table bridges (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  layer text not null check (layer in ('existing', 'proposed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bridge_teeth (
  id uuid primary key default uuid_generate_v4(),
  bridge_id uuid not null references bridges(id) on delete cascade,
  tooth_number integer not null check (tooth_number >= 1 and tooth_number <= 32),
  role text not null check (role in ('abutment', 'pontic')),
  unique (bridge_id, tooth_number)
);

create index idx_bridges_patient on bridges(patient_id);
create index idx_bridge_teeth_bridge on bridge_teeth(bridge_id);

alter table tooth_overlays enable row level security;
alter table bridges enable row level security;
alter table bridge_teeth enable row level security;

create policy "authenticated full access" on tooth_overlays for all to authenticated using (true) with check (true);
create policy "authenticated full access" on bridges for all to authenticated using (true) with check (true);
create policy "authenticated full access" on bridge_teeth for all to authenticated using (true) with check (true);

-- Explicit grants alongside RLS - see the note in schema.sql for why. Without
-- this, PostgREST can report a brand-new table as "not found in the schema
-- cache" even once it genuinely exists with correct RLS.
grant all on tooth_overlays, bridges, bridge_teeth to anon, authenticated, service_role;
notify pgrst, 'reload schema';
