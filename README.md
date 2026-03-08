# merchandise-sales-automation

メルカリ通知を入口に、候補抽出・価格比較・レビュー支援を行うモノレポです。

## 方針（重要）

- `packages/shared` / `packages/common` / `packages/utils` は作りません。
- 共通化は責務ベースの package（`contracts` / `domain` / `db` / `llm` / `ui`）に寄せます。
- `packages/ui` は primitive（DataTable / Filters / ChartShell / Badge）専用で、feature component を置きません（lint で検知）。
- `packages/domain` は pure function 専用で、DB/HTTP/LLM/フレームワーク依存を禁止します。
- `apps/web` と `apps/jobs` から package 内部 (`packages/*/src/*`) を相対 import しません。
  `@merchandise/*` の公開 API だけを使います。

## 開発コマンド

```bash
pnpm install
pnpm infra:up
pnpm db:migrate
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55444/postgres" pnpm db:seed
pnpm lint
pnpm typecheck
pnpm test
pnpm contracts:export-openapi
pnpm --filter @merchandise/db test
```

## DB package

`packages/db` には以下を用意しています。

- runtime client: `createDb(url)` (`drizzle-orm/postgres-js` + `postgres`)
- test helper: `db({ migrations, cache })` (`drizzle-orm/pglite` + `@electric-sql/pglite`)
- 共通型: `src/types.ts`

migration は `database/migrations` を正本として扱います。
Supabase は Postgres のホスティング先としてのみ扱い、`supabase-js` / `supabase` CLI は使いません。

運用ルールは [docs/db-operations.md](/Users/nasjp/ghq/github.com/nasjp/merchandise-sales-automation/docs/db-operations.md) を参照してください。

運用手順は以下を参照してください。

- [docs/operations.md](/Users/nasjp/ghq/github.com/nasjp/merchandise-sales-automation/docs/operations.md)
- [docs/runbook.md](/Users/nasjp/ghq/github.com/nasjp/merchandise-sales-automation/docs/runbook.md)

## production UI 保護

`apps/web` は production 環境で `PASSWORD` を使った Basic 認証を有効化します。
