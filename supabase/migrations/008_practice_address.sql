alter table practice_settings add column if not exists address text not null default '';

notify pgrst, 'reload schema';
