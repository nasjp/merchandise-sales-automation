# DB Operations Spec

## 1. Scope and ownership

- TS schema source of truth: `packages/db/src/schema/**`
- SQL migration source of truth: `supabase/migrations/**`
- Seed source of truth: `supabase/seed.sql`

## 2. Internal table boundary

Server-only internal tables (never expose direct client access):

- `raw_events`
- `ai_runs`
- `task_audit`

Review UI tables (read/write only via `apps/web` server layer):

- `candidates`
- `targets`
- `price_snapshots`

Rule:

- Supabase client SDK から内部テーブルへ直接アクセスしない
- 画面・API は必ず `apps/web/src/server/**` の command/query 経由で操作する

## 3. Hand-written migration policy

Hand-written migration is required for:

- RLS policy (`create policy`, `alter table ... enable row level security`)
- `extension` (`create extension if not exists ...`)
- `trigger` / `function`
- `view` / `materialized view`

Naming:

- `supabase/migrations/<4digit>_<summary>.sql`
- 例: `0001_rls_policies.sql`, `0002_refresh_trigger.sql`

Rules:

- Drizzle generated migration はそのまま保持する
- 手書き migration は Drizzle 生成 SQL の後ろに積む
- 1 migration = 1責務（review しやすい粒度）

## 4. Migration execution flow

### local

1. schema 変更（`packages/db/src/schema/**`）
2. migration 生成

```bash
pnpm --filter @merchandise/db db:generate
```

3. 必要なら hand-written migration を追加
4. DB 再作成 + seed

```bash
supabase db reset
```

補足:

- Supabase CLI v2.67.1 では reset 後の container restart で `502` が返ることがある
- その場合でも DB 再作成が完了しているケースがあるため、以下で seed を検証する

```bash
psql \"postgresql://postgres:postgres@127.0.0.1:54322/postgres\" -Atc \"select id, sku from targets order by id;\"
psql \"postgresql://postgres:postgres@127.0.0.1:54322/postgres\" -Atc \"select rolname from pg_roles where rolname in ('msa_ingest','msa_reviewer') order by rolname;\"
```

5. backend test 実行

```bash
pnpm --filter @merchandise/db test
pnpm test
```

### staging / production

1. `supabase link --project-ref <PROJECT_REF>`（初回のみ）
2. migration 適用

```bash
supabase db push
```

3. deploy 後に health check（`apps/web` API + jobs）

## 5. Test migration path

`packages/db/src/test.ts` では migration path を上書きできる。

- 既定: `packages/db/database/migrations`
- 上書き: `DATABASE_MIGRATIONS_PATH`

例:

```bash
DATABASE_MIGRATIONS_PATH=supabase/migrations pnpm --filter @merchandise/db test
```
