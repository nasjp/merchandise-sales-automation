# DB Operations Spec

## 1. Scope and ownership

- TS schema source of truth: `packages/db/src/schema/**`
- SQL migration source of truth: `database/migrations/**`
- Seed source of truth: `database/seed.sql`

前提:

- Supabase は **Postgres のホスティング先**としてのみ扱う。
- `supabase-js` は使わない。
- `supabase` CLI は使わない（`supabase link`, `supabase db push` は不使用）。
- migration は `drizzle-kit` で生成・適用する。

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

- 内部テーブルへクライアントから直接アクセスしない
- 画面・API は `apps/web/src/server/**` の command/query 経由で操作する

## 3. Hand-written migration policy

Hand-written migration is required for:

- RLS policy (`create policy`, `alter table ... enable row level security`)
- `extension` (`create extension if not exists ...`)
- `trigger` / `function`
- `view` / `materialized view`

Naming:

- `database/migrations/<4digit>_<summary>.sql`
- 例: `0001_rls_policies.sql`, `0002_refresh_trigger.sql`

Rules:

- Drizzle generated migration はそのまま保持する
- 手書き migration は Drizzle 生成 SQL の後ろに積む
- 1 migration = 1責務（review しやすい粒度）

## 4. Local infra（Docker Compose）

このプロジェクトではローカル DB を Docker Compose で起動する。

```bash
pnpm infra:up
```

主なポート（デフォルト）:

- Postgres: `127.0.0.1:55444`
- MinIO API: `127.0.0.1:59100`
- MinIO Console: `127.0.0.1:59101`

必要なら環境変数で上書き:

- `POSTGRES_HOST_PORT`
- `MINIO_API_HOST_PORT`
- `MINIO_CONSOLE_HOST_PORT`

停止:

```bash
pnpm infra:down
```

## 5. Migration execution flow

### local

1. schema 変更（`packages/db/src/schema/**`）
2. migration 生成

```bash
pnpm --filter @merchandise/db db:generate
```

3. migration 適用（`DATABASE_URL` 未指定時は `127.0.0.1:55444` を使用）

```bash
pnpm db:migrate
```

4. seed 適用

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55444/postgres" pnpm db:seed
```

5. backend test 実行

```bash
pnpm --filter @merchandise/db test
pnpm test
```

### staging / production

`DATABASE_URL` を対象環境に向けて `drizzle-kit` で直接適用する。

```bash
DATABASE_URL="<staging_or_prod_url>" pnpm db:migrate
```

適用後に health check（`apps/web` API + jobs）を実施する。

## 6. Test migration path

`packages/db/src/test.ts` では migration path を上書きできる。

- 既定: `database/migrations`
- 上書き: `DATABASE_MIGRATIONS_PATH`

例:

```bash
DATABASE_MIGRATIONS_PATH=database/migrations pnpm --filter @merchandise/db test
```
