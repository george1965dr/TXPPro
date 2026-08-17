alter table patients add column if not exists chart_notes text not null default '';

comment on column patients.chart_notes is
  'Free-text clinical notes about existing conditions that don''t fit the odontogram''s chartable findings.';

notify pgrst, 'reload schema';
