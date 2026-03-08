create table if not exists raw_events (
  id text primary key,
  source text not null default 'android',
  notification_id text,
  title text not null,
  body text not null,
  dedupe_key text not null,
  received_at timestamp not null,
  processed_at timestamp,
  created_at timestamp not null default now()
);
--> statement-breakpoint

create unique index if not exists raw_events_dedupe_key_uidx on raw_events (dedupe_key);
--> statement-breakpoint

create table if not exists targets (
  id text primary key,
  sku text not null,
  title_keyword text not null,
  model_keyword text,
  is_active boolean not null default true,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
--> statement-breakpoint

create unique index if not exists targets_sku_uidx on targets (sku);
--> statement-breakpoint

create table if not exists price_snapshots (
  id text primary key,
  target_id text not null references targets(id) on delete cascade,
  observed_at timestamp not null default now(),
  sell_estimate_yen integer not null,
  buy_limit_yen integer not null,
  liquidity_score integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp not null default now()
);
--> statement-breakpoint

create table if not exists candidates (
  id text primary key,
  raw_event_id text not null references raw_events(id) on delete cascade,
  target_id text references targets(id) on delete set null,
  listing_title text not null,
  listing_price_yen integer not null,
  matched_model text,
  score integer not null default 0,
  review_state text not null default 'pending',
  reason text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
--> statement-breakpoint

create table if not exists ai_runs (
  id text primary key,
  candidate_id text references candidates(id) on delete set null,
  task_name text not null,
  provider text not null,
  model text not null,
  status text not null default 'success',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  executed_at timestamp not null default now(),
  created_at timestamp not null default now()
);
--> statement-breakpoint

create table if not exists task_audit (
  id text primary key,
  task_name text not null,
  run_id text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  started_at timestamp not null default now(),
  finished_at timestamp,
  created_at timestamp not null default now()
);
--> statement-breakpoint

create unique index if not exists task_audit_run_id_uidx on task_audit (run_id);
