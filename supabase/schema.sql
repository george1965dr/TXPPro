-- Treatment Planning App schema
-- Run against a fresh Supabase project (SQL Editor, or `supabase db push`).
--
-- Security model: this is a single-practice tool, not multi-tenant SaaS.
-- Every table gets RLS enabled with one policy - any row is readable/writable
-- by any authenticated Supabase user, and by no one else. This is the fix for
-- the exact hole found in the previous version of this app (RLS was disabled
-- entirely, and a service-role key was used in a route with no auth check).
-- If the practice later adds staff logins that need restricted roles, add
-- narrower policies then - don't build that scoping speculatively now.

create extension if not exists "uuid-ossp";

-- ============================================================================
-- Core: patients, procedures, treatment plans, sequencing
-- ============================================================================

create table patients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  birth_date date not null,
  email text,
  medical_history text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table procedures (
  id uuid primary key default uuid_generate_v4(),
  ada_code text not null unique,
  description text not null,
  fee numeric(10, 2) not null,
  tooth_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table treatment_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  total_fee numeric(10, 2) not null default 0,
  -- Set when the doctor marks the plan accepted on the present-to-patient
  -- view; null while still a draft. Manually toggled, not auto-cleared on
  -- edit - editing an accepted plan is the doctor's call to re-confirm.
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table treatment_plan_items (
  id uuid primary key default uuid_generate_v4(),
  treatment_plan_id uuid not null references treatment_plans(id) on delete cascade,
  procedure_id uuid not null references procedures(id),
  quantity integer not null default 1,
  tooth_numbers text[],
  surfaces text[],
  -- Snapshotted from procedures.fee at the moment this item is added (or
  -- later edited by the doctor) - never a live join, so editing the master
  -- fee list never reprices an item already on a plan.
  fee numeric(10, 2) not null,
  -- Links this item to its drawn proposed-layer chart graphic (e.g.
  -- "14-filling", or "bridge-<id>-14" for one tooth of a bridge). The
  -- kanban-add action writes the plan item and the chart graphic together
  -- and uses this to keep them in sync on removal. Null for tooth-less
  -- items (e.g. a cleaning) with nothing to draw.
  chart_key text,
  created_at timestamptz not null default now(),
  unique (treatment_plan_id, chart_key)
);

create table sequenced_treatment_plans (
  id uuid primary key default uuid_generate_v4(),
  treatment_plan_id uuid not null references treatment_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (treatment_plan_id)
);

create table sequenced_treatment_plan_items (
  id uuid primary key default uuid_generate_v4(),
  sequenced_treatment_plan_id uuid not null references sequenced_treatment_plans(id) on delete cascade,
  treatment_plan_item_id uuid not null references treatment_plan_items(id),
  appointment_number integer not null check (appointment_number >= 1 and appointment_number <= 20),
  created_at timestamptz not null default now(),
  unique (treatment_plan_item_id) -- an item is scheduled into at most one visit at a time
);

create index idx_treatment_plan_items_plan on treatment_plan_items(treatment_plan_id);
create index idx_sequenced_items_plan on sequenced_treatment_plan_items(sequenced_treatment_plan_id);

-- ============================================================================
-- Odontogram: surface + whole-tooth conditions, existing vs. proposed
-- ============================================================================

create table tooth_conditions (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number integer not null check (tooth_number >= 1 and tooth_number <= 32),
  surface text not null check (surface in ('mesial', 'distal', 'occlusal', 'facial', 'lingual', 'whole')),
  condition_type text not null, -- 'caries' | 'filling' | 'sealant' | 'crown' | 'missing'
  layer text not null check (layer in ('existing', 'proposed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, tooth_number, surface, layer)
);

create index idx_tooth_conditions_patient on tooth_conditions(patient_id, tooth_number);

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
  overlay_type text not null, -- see OverlayType in lib/types.ts for the current vocabulary
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
  -- 'implant' means the abutments are implants rather than natural teeth -
  -- same abutment/pontic shape, different retainer billing code.
  bridge_type text not null default 'tooth' check (bridge_type in ('tooth', 'implant')),
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

-- ============================================================================
-- Periodontal charting: 6-point probing depth + recession per tooth,
-- plus per-tooth mobility/furcation.
-- ============================================================================

create table periodontal_measurements (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number integer not null check (tooth_number >= 1 and tooth_number <= 32),
  site text not null check (site in ('DB', 'B', 'MB', 'ML', 'L', 'DL')),
  probing_depth integer check (probing_depth >= 0 and probing_depth <= 15),
  recession integer check (recession >= 0 and recession <= 15),
  bleeding_on_probing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, tooth_number, site)
);

create table tooth_perio_status (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  tooth_number integer not null check (tooth_number >= 1 and tooth_number <= 32),
  mobility integer not null default 0 check (mobility >= 0 and mobility <= 3),
  furcation integer check (furcation >= 0 and furcation <= 3), -- null unless molar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, tooth_number)
);

create index idx_perio_measurements_patient on periodontal_measurements(patient_id, tooth_number);

-- ============================================================================
-- Patient media: intraoral photos and whole-mouth video
-- ============================================================================

create table patient_media (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  type text not null check (type in ('photo', 'video')),
  tooth_number integer check (tooth_number >= 1 and tooth_number <= 32),
  storage_path text not null,
  duration_seconds integer,
  captured_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_patient_media_patient on patient_media(patient_id, captured_at desc);

-- Storage bucket for the actual photo/video files. Private bucket - access
-- goes through RLS-scoped signed URLs, never a public bucket.
insert into storage.buckets (id, name, public)
values ('patient-media', 'patient-media', false)
on conflict (id) do nothing;

-- ============================================================================
-- Row Level Security - authenticated users only, on every table.
-- ============================================================================

alter table patients enable row level security;
alter table procedures enable row level security;
alter table treatment_plans enable row level security;
alter table treatment_plan_items enable row level security;
alter table sequenced_treatment_plans enable row level security;
alter table sequenced_treatment_plan_items enable row level security;
alter table tooth_conditions enable row level security;
alter table tooth_overlays enable row level security;
alter table bridges enable row level security;
alter table bridge_teeth enable row level security;
alter table periodontal_measurements enable row level security;
alter table tooth_perio_status enable row level security;
alter table patient_media enable row level security;

create policy "authenticated full access" on patients for all to authenticated using (true) with check (true);
create policy "authenticated full access" on procedures for all to authenticated using (true) with check (true);
create policy "authenticated full access" on treatment_plans for all to authenticated using (true) with check (true);
create policy "authenticated full access" on treatment_plan_items for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sequenced_treatment_plans for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sequenced_treatment_plan_items for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tooth_conditions for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tooth_overlays for all to authenticated using (true) with check (true);
create policy "authenticated full access" on bridges for all to authenticated using (true) with check (true);
create policy "authenticated full access" on bridge_teeth for all to authenticated using (true) with check (true);
create policy "authenticated full access" on periodontal_measurements for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tooth_perio_status for all to authenticated using (true) with check (true);
create policy "authenticated full access" on patient_media for all to authenticated using (true) with check (true);

create policy "authenticated read patient media" on storage.objects for select to authenticated
  using (bucket_id = 'patient-media');
create policy "authenticated upload patient media" on storage.objects for insert to authenticated
  with check (bucket_id = 'patient-media');
create policy "authenticated delete patient media" on storage.objects for delete to authenticated
  using (bucket_id = 'patient-media');

-- Explicit grants, belt-and-suspenders alongside RLS. Supabase normally
-- auto-grants these for new tables in `public`, but a project that's had
-- that default privilege configuration touched (or just behaves
-- unpredictably - this bit us once) can leave PostgREST reporting a table
-- as "not found in the schema cache" even though it exists and RLS is
-- correctly configured. Cheap insurance against a multi-hour debugging loop.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
