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
  -- docs/search-condition-mercari.md 1. Apple Watch SE 第2世代 44mm GPS
  ('target_apple_watch_se2_44', 'APPLE-WATCH-SE2-44-GPS', 'Apple Watch', 'SE244MMGPS', true),
  -- docs/search-condition-mercari.md 2. Apple Watch SE 第2世代 40mm GPS
  ('target_apple_watch_se2_40', 'APPLE-WATCH-SE2-40-GPS', 'Apple Watch', 'SE240MMGPS', true),
  -- docs/search-condition-mercari.md 3. Apple Watch Series 8 45mm GPS
  ('target_apple_watch_s8_45', 'APPLE-WATCH-S8-45-GPS', 'Apple Watch', '845MMGPS', true),
  -- docs/search-condition-mercari.md 4. Apple Watch Series 8 41mm GPS
  ('target_apple_watch_s8_41', 'APPLE-WATCH-S8-41-GPS', 'Apple Watch', '841MMGPS', true),
  -- docs/search-condition-mercari.md 5. SONY WH-1000XM5
  ('target_wh1000xm5', 'SONY-WH-1000XM5', 'WH-1000XM5', 'WH1000XM5', true),
  -- docs/search-condition-mercari.md 6. Nintendo Switch Lite
  ('target_switch_lite', 'NINTENDO-SWITCH-LITE', 'Switch Lite', null, true),
  -- docs/search-condition-mercari.md 7. Nintendo Switch 有機ELモデル
  ('target_switch_oled', 'NINTENDO-SWITCH-OLED', 'Switch 有機EL', null, true),
  -- docs/search-condition-mercari.md 8. Google Pixel 7a 128GB
  ('target_pixel7a_128', 'GOOGLE-PIXEL-7A-128', 'Pixel 7a', '7A128GB', true),
  -- docs/search-condition-mercari.md 9. iPhone 13 128GB SIMフリー
  ('target_iphone13_128_simfree', 'IPHONE-13-128-SIMFREE', 'iPhone 13', 'IPHONE13128GB', true),
  -- docs/search-condition-mercari.md 10. iPhone 13 mini 128GB SIMフリー
  ('target_iphone13mini_128_simfree', 'IPHONE-13-MINI-128-SIMFREE', 'iPhone 13 mini', 'IPHONE13MINI128GB', true)
on conflict (sku) do update
set
  title_keyword = excluded.title_keyword,
  model_keyword = excluded.model_keyword,
  is_active = excluded.is_active,
  updated_at = now();

-- Legacy bootstrap targets (pre docs/search-condition-mercari.md) are kept but disabled
-- to avoid accidental matching after reseeding.
update targets
set
  is_active = false,
  updated_at = now()
where sku in (
  'PS5-CFI-2000',
  'SWITCH-HAC-001',
  'SWITCHLITE-HDH-001',
  'XBOX-SERIES-X',
  'QUEST3-512',
  'IPHONE15PRO-256'
);
