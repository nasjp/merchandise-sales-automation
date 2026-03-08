# Operations Guide

## 0. DB 運用原則

- Supabase は managed Postgres の置き場としてのみ使用する
- `supabase-js` / `supabase` CLI は運用で使用しない
- DB migration は `drizzle-kit`（`pnpm db:generate` / `pnpm db:migrate`）を使う
- ローカル DB は `docker compose`（`pnpm infra:up`）で起動する

## 1. Environment matrix

### apps/web

- `DATABASE_URL`: Supabase Postgres 接続文字列
- `ANDROID_INGEST_SHARED_SECRET`: Android 署名検証キー
- `TRIGGER_API_BASE_URL`: Trigger API ベース URL

### apps/jobs

- `DATABASE_URL`: Supabase Postgres 接続文字列
- `TRIGGER_API_KEY`: Trigger 実行用キー
- `TRIGGER_API_BASE_URL`: Trigger API ベース URL

### apps/android

- `INGEST_ENDPOINT`: `https://<host>` または `https://<host>/api/ingest/android`
- `ANDROID_INGEST_SHARED_SECRET`: HMAC 署名キー

## 2. Secret rotation procedure

対象:

- `ANDROID_INGEST_SHARED_SECRET`
- `TRIGGER_API_KEY`
- `DATABASE_URL`（必要時）

手順:

1. 新しい secret を生成する（32 byte 以上）。
2. `staging` の `web/jobs/android` へ新 secret を登録する。
3. Android を先に更新し、新 secret で送信を開始する。
4. `web` 側で新 secret 受信を確認する（ingest API 401 が出ない）。
5. `production` に同じ順序で反映する。
6. 旧 secret を無効化し、Runbook に実施時刻を記録する。

補足:

- Android と web の secret 更新は必ず同日内で実施する。
- ローテーション中の監視で `ingest auth fail rate` を重点確認する。

## 3. Monitoring metrics

必須メトリクス:

- 失敗率: `task_audit` の `failed / total`
- 遅延: `raw_events.received_at -> candidates.created_at`
- 候補生成数: 日次 `candidates` 生成件数
- 承認率: `candidates.review_state = approved / reviewed total`

推奨アラート閾値:

- 失敗率: 5分平均で 5% 超
- 遅延: p95 が 120 秒超
- 候補生成数: 前週同曜日比で 50% 未満
- 承認率: 7日移動平均で急落（前週比 -30%）

## 4. Deployment checklist

外部環境で実施する項目:

- Vercel project を `apps/web` に接続
- Trigger.dev project を `apps/jobs/trigger.config.ts` に接続
- Supabase を `staging` / `production` で分離

実施後に必ず `staging` で E2E を実行する。
