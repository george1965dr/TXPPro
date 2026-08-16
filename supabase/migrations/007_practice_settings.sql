-- Single-row settings table for this practice's display name, shown in the
-- sticky header. Singleton via a fixed-value primary key (id always 1)
-- rather than a lookup key, since there's exactly one practice per deploy.
create table if not exists practice_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default '',
  updated_at timestamptz not null default now()
);

insert into practice_settings (id, name) values (1, '') on conflict (id) do nothing;

alter table practice_settings enable row level security;

create policy "authenticated full access" on practice_settings for all to authenticated using (true) with check (true);

grant all on practice_settings to anon, authenticated, service_role;

notify pgrst, 'reload schema';
