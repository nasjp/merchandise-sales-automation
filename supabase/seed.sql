-- Minimal seed for local/staging bootstrap.

-- application DB roles (for permission simulation in local development)
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'msa_ingest') then
    create role msa_ingest nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'msa_reviewer') then
    create role msa_reviewer nologin;
  end if;
end;
$$;

grant usage on schema public to msa_ingest, msa_reviewer;
grant select, insert, update on table raw_events, candidates, task_audit to msa_ingest;
grant select, update on table candidates, price_snapshots, targets to msa_reviewer;

insert into targets (id, sku, title_keyword, model_keyword, is_active)
values
  ('target_ps5_cfi2000', 'PS5-CFI-2000', 'PlayStation 5', 'CFI-2000', true),
  ('target_switch_hac001', 'SWITCH-HAC-001', 'Nintendo Switch', 'HAC-001', true),
  ('target_switch_lite_hdh001', 'SWITCHLITE-HDH-001', 'Nintendo Switch Lite', 'HDH-001', true),
  ('target_xbox_seriesx', 'XBOX-SERIES-X', 'Xbox Series X', null, true),
  ('target_meta_quest3_512', 'QUEST3-512', 'Meta Quest 3', null, true),
  ('target_iphone15pro_256', 'IPHONE15PRO-256', 'iPhone 15 Pro', null, true)
on conflict (sku) do update
set
  title_keyword = excluded.title_keyword,
  model_keyword = excluded.model_keyword,
  is_active = excluded.is_active,
  updated_at = now();
