### 目的

メルカリ上で、**取引頻度が高く相場が読みやすい商品**を定点観察し、
**異常に安い出品だけを検知して候補化**し、
人間が確認・承認したうえで、仕入れ判断につなげることです。

要するに、このシステムは

* 通知を拾う
* 商品候補を正規化する
* 基準価格と比較する
* 安すぎる候補を絞る
* 人間がレビューしやすくする

ための **仕入れ判断支援システム** です。

自動化の中心は「購入そのもの」ではなく、まずは
**検知精度の向上** と **レビュー工数の削減** にあります。

---

### データフロー

#### 1. Android がメルカリのプッシュ通知を受け取る

* Android アプリがメルカリ通知を取得
* 通知タイトルや本文など最低限の情報を取り出す
* Next.js 側の ingest API に送信する

#### 2. Web API が生イベントとして保存する

* `apps/web` の API が通知を受信
* Supabase(Postgres) に `raw_events` として保存
* `ingest.processRawEvent` の run を記録し、同じ処理内で target/snapshot を参照して `candidates` まで同期生成する

#### 3. Trigger.dev が通知を正規化する

* 本来はこの段で通知文言から商品名、型番、価格などを抽出
* 対象SKUにマッチするか判定
* 必要なら LLM を使って補助的に属性抽出する
* 将来は `apps/web` から切り離して jobs 側に移す

#### 4. 別ジョブで基準価格を定期更新する

* Trigger.dev の scheduled task が定期的に走る
* 各 target の相場データを更新する
* 売値推定、流動性、買値上限などを計算して `price_snapshots` に保存する

#### 5. 候補と基準価格を比較する

* 通知から作られた candidate と最新 snapshot を照合
* 想定利益、異常値度合い、レビュー優先度を算出
* 「要レビュー」「除外」などの状態にする

#### 6. Web UI で人間が確認する

* Next.js の管理画面で候補一覧を見る
* 元通知、抽出結果、相場、想定利益を確認する
* 承認・却下・再処理を行う

---

### 役割分担

* **Android**

  * 通知を拾って送るだけ

* **Next.js / Vercel**

  * UI
  * 公開 API
  * 承認画面

* **Supabase / Drizzle**

  * システムの正本データを保持

* **Trigger.dev**

  * 正規化
  * 基準価格更新
  * 候補評価
  * LLM 実行
  * 定期ジョブ

---

### 一文で言うと

**「メルカリ通知を入口にして、相場と比較し、安すぎる出品だけを人間が判断しやすい形にするシステム」** です。


## まず固定する設計方針

1. **deployable は 3 つだけ**

   * `web`
   * `jobs`
   * `android`

2. **再利用コードは package に逃がす**

   * business rule
   * DB schema/query
   * Mercari 特有の parser
   * LLM adapter
   * DTO / contract

3. **やってはいけないこと**

   * `packages/shared` / `packages/common` / `packages/utils` を作る
     → 100% ゴミ箱になる
   * `apps/web` に pricing / anomaly 判定 / LLM 呼び出しを置く
     → request/response 層と durable execution が混ざる
   * `apps/android` に価格判定や dedupe を置く
     → 将来の変更点が端末側に散る

---

## 推奨 build system

### ルート

* **package manager**: `pnpm`
* **JS/TS task orchestrator**: `Turborepo`
* **Node apps の local/CI build**: `turbo run ...`
* **Android build**: `Gradle (Kotlin DSL)` を独立
* **DB schema/migration authoring**: `Drizzle Kit`
* **DB infra/local stack**: `Docker Compose (Postgres + MinIO)`
* **background runtime**: `Trigger.dev`

### なぜこの組み合わせか

* `pnpm` は workspace 管理が軽い
* `turbo` は `web` と `jobs` の依存関係と cache を扱える
* Android まで無理に turbo に入れる必要はない
* Trigger は durable orchestration を持っているので、job runner を自作しなくて済む
* Supabase は DB 正本、Trigger は execution plane、Vercel は UI/API plane で責務が綺麗に割れる

---

## アプリごとの責務

### `apps/web`

**責務**

* 管理UI
* Android からの公開 ingest endpoint
* 手動承認・手動却下
* `targets` / `price_snapshots` / `candidates` / `raw_events` の閲覧
* Trigger task の起動入口
* 認証 UI（実装方式は DB プロバイダ非依存で選定）

**置いてよいもの**

* route handlers
* server actions
* read model / query composition
* 認証 / 権限チェック
* Trigger task trigger client

**置いてはいけないもの**

* 長時間処理
* LLM 呼び出し本体
* 定期 price refresh
* anomaly 判定ロジック本体

### `apps/jobs`

**責務**

* Trigger.dev task の定義
* scheduled task
* raw event の正規化
* price snapshot 再計算
* candidate 評価
* LLM 呼び出し
* 再処理、バックフィル、メンテ job

**置いてよいもの**

* `/trigger` 配下の task
* task runtime factory
* task-only config
* orchestration code

**置いてはいけないもの**

* React UI
* route handler
* DB schema定義
* ドメインルール本体

### `apps/android`

**責務**

* Mercari 通知の取得
* 最低限の payload 化
* `web` の ingest endpoint への送信
* 短い再送
* endpoint / secret の設定画面

**置いてよいもの**

* `NotificationListenerService`
* `WorkManager`
* Retrofit/OkHttp などの送信
* 設定保存

**置いてはいけないもの**

* SKU 判定
* 異常値判定
* 相場計算
* サーバー側と別実装の dedupe / business rule

---

## package ごとの責務

### `packages/contracts`

Zod と TypeScript の **入出力契約**。
`web` と `jobs` の境界をここで固定します。Android は直接 import しませんが、`scripts/export-openapi.ts` で OpenAPI/JSON Schema を生成して連携します。

### `packages/domain`

**純粋関数だけ**。
価格推定、buy limit、liquidity、candidate score、watch target matching など。
ここは **DB も HTTP も LLM も知らない** べきです。

### `packages/db`

Drizzle schema / client / repository / query layer。
ただし **domain は入れない**。ここは infra です。
`drizzle.config.ts` はここに置き、migration 出力先だけ `../../database/migrations` に向けます。
実装は **runtime client** と **test client(PGlite)** を明示的に分けます。

* runtime（本番/開発）:

  * `drizzle-orm/postgres-js` + `postgres` で `createDb(url)` を提供
  * 例:

    ```ts
    export const createDb = (url: string) =>
      drizzle({
        client: postgres(url, { prepare: false }),
        schema,
      });
    ```

* test（backend test）:

  * `drizzle-orm/pglite` + `@electric-sql/pglite` を使う
  * migration を毎回同じ `database/migrations` から適用できる helper を置く
  * 高速化のために `clone` + `truncate` ベースの再利用を許可する

`types.ts` には postgres / pglite の DB と transaction を受ける共通 `DB` 型を置き、repository 層はこの型を受けるようにします。

### `packages/mercari`

Mercari 固有の知識。
通知文言の parse、型番抽出、状態語彙、送料表現、ジャンク語彙、タイトル正規化。
**Mercari 依存はここに隔離**します。

### `packages/llm`

provider adapter、prompt template、structured output parser。
失敗時の retry/timeout と監査ログ（`ai_runs`）のための実行情報をここで統一する。
OpenAI/Anthropic/Gemini を後から入れ替える境界です。

### `packages/ui`

汎用 UI primitive だけ。
DataTable、filters、chart shell、badge など。
**feature component は入れない**。feature component は `apps/web` に置きます。

### `packages/eslint-config`, `packages/typescript-config`

モノレポ共通設定。
`packages/eslint-config` では少なくとも次を lint で検証します。

* `packages/domain` は DB/LLM/Next 依存を持たない
* `apps/web` と `apps/jobs` は `packages/*/src/*` を相対 import しない

これは Turbo の標準的な切り方です。([Turborepo][5])

---

## 推奨 directory architecture

```text
repo/
├─ apps/
│  ├─ web/                           # Vercel deploy target
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (dashboard)/
│  │  │  │  │  ├─ raw-events/
│  │  │  │  │  ├─ candidates/
│  │  │  │  │  ├─ targets/
│  │  │  │  │  ├─ price-snapshots/
│  │  │  │  │  └─ settings/
│  │  │  │  ├─ api/
│  │  │  │  │  ├─ ingest/android/route.ts
│  │  │  │  │  ├─ candidates/[candidateId]/approve/route.ts
│  │  │  │  │  ├─ candidates/[candidateId]/reject/route.ts
│  │  │  │  │  ├─ targets/[targetId]/refresh/route.ts
│  │  │  │  │  ├─ trigger/runs/[runId]/route.ts
│  │  │  │  │  └─ trigger/runs/[runId]/reprocess/route.ts
│  │  │  │  ├─ layout.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ features/
│  │  │  │  ├─ raw-events/
│  │  │  │  ├─ candidates/
│  │  │  │  ├─ targets/
│  │  │  │  ├─ snapshots/
│  │  │  │  └─ runs/
│  │  │  ├─ components/
│  │  │  ├─ server/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ db/
│  │  │  │  ├─ queries/
│  │  │  │  ├─ commands/
│  │  │  │  └─ trigger/
│  │  │  └─ env.ts
│  │  ├─ turbo.json
│  │  ├─ next.config.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ jobs/                          # Trigger.dev deploy target
│  │  ├─ trigger/
│  │  │  ├─ index.ts                 # 全 task export
│  │  │  ├─ ingest/
│  │  │  │  ├─ processRawEvent.ts
│  │  │  │  └─ reprocessRawEvent.ts
│  │  │  ├─ pricing/
│  │  │  │  ├─ refreshDueTargets.ts
│  │  │  │  ├─ recomputeSnapshot.ts
│  │  │  │  └─ backfillSnapshots.ts
│  │  │  ├─ candidates/
│  │  │  │  ├─ evaluateCandidate.ts
│  │  │  │  └─ publishReviewState.ts
│  │  │  ├─ ai/
│  │  │  │  ├─ extractListingAttributes.ts
│  │  │  │  └─ explainOutlier.ts
│  │  │  ├─ maintenance/
│  │  │  │  ├─ retryStuckRuns.ts
│  │  │  │  └─ cleanupOldArtifacts.ts
│  │  │  └─ scheduled/
│  │  │     └─ index.ts
│  │  ├─ src/
│  │  │  ├─ runtime/
│  │  │  │  ├─ env.ts
│  │  │  │  ├─ logger.ts
│  │  │  │  └─ telemetry.ts
│  │  │  ├─ factories/
│  │  │  │  ├─ db.ts
│  │  │  │  ├─ mercari.ts
│  │  │  │  └─ llm.ts
│  │  │  └─ task-helpers/
│  │  ├─ trigger.config.ts
│  │  ├─ turbo.json
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  └─ android/                       # Repoには置くが pnpm/turbo の主対象ではない
│     ├─ app/
│     │  └─ src/main/java/com/example/mercariwatch/
│     │     ├─ notification/
│     │     │  └─ MercariNotificationListenerService.kt
│     │     ├─ work/
│     │     │  └─ ForwardNotificationWorker.kt
│     │     ├─ network/
│     │     │  ├─ IngestApi.kt
│     │     │  └─ HmacSigner.kt
│     │     ├─ model/
│     │     │  └─ IngestPayload.kt
│     │     ├─ settings/
│     │     │  └─ SettingsStore.kt
│     │     └─ ui/
│     │        └─ SettingsActivity.kt
│     ├─ build.gradle.kts
│     ├─ settings.gradle.kts
│     └─ gradle/libs.versions.toml
│
├─ packages/
│  ├─ contracts/
│  │  └─ src/
│  │     ├─ ingest.ts
│  │     ├─ targets.ts
│  │     ├─ candidates.ts
│  │     ├─ tasks.ts
│  │     └─ index.ts
│  │
│  ├─ domain/
│  │  └─ src/
│  │     ├─ pricing/
│  │     │  ├─ computeSellEstimate.ts
│  │     │  ├─ computeBuyLimit.ts
│  │     │  └─ computeLiquidityScore.ts
│  │     ├─ matching/
│  │     │  ├─ normalizeTitle.ts
│  │     │  ├─ normalizeModel.ts
│  │     │  └─ matchTarget.ts
│  │     ├─ candidates/
│  │     │  ├─ scoreCandidate.ts
│  │     │  └─ decideReviewState.ts
│  │     ├─ money/
│  │     └─ index.ts
│  │
│  ├─ db/
│  │  ├─ src/
│  │  │  ├─ client.ts               # postgres-js runtime client(createDb)
│  │  │  ├─ test.ts                 # PGlite test helper(db({ migrations, cache }))
│  │  │  ├─ types.ts                # postgres/pglite 共通 DB 型
│  │  │  ├─ schema/
│  │  │  │  ├─ rawEvents.ts
│  │  │  │  ├─ targets.ts
│  │  │  │  ├─ priceSnapshots.ts
│  │  │  │  ├─ candidates.ts
│  │  │  │  ├─ aiRuns.ts
│  │  │  │  └─ taskAudit.ts
│  │  │  ├─ repositories/
│  │  │  │  ├─ rawEventsRepo.ts
│  │  │  │  ├─ targetsRepo.ts
│  │  │  │  ├─ snapshotsRepo.ts
│  │  │  │  ├─ candidatesRepo.ts
│  │  │  │  └─ aiRunsRepo.ts
│  │  │  └─ index.ts
│  │  ├─ drizzle.config.ts
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  ├─ mercari/
│  │  └─ src/
│  │     ├─ notification/
│  │     │  └─ parseMercariPush.ts
│  │     ├─ listing/
│  │     │  ├─ parsePrice.ts
│  │     │  ├─ parseCondition.ts
│  │     │  ├─ parseShipping.ts
│  │     │  └─ extractModel.ts
│  │     └─ index.ts
│  │
│  ├─ llm/
│  │  └─ src/
│  │     ├─ providers/
│  │     ├─ prompts/
│  │     ├─ structured/
│  │     └─ index.ts
│  │
│  ├─ ui/
│  │  └─ src/
│  │     ├─ data-table/
│  │     ├─ filters/
│  │     ├─ charts/
│  │     └─ index.ts
│  │
│  ├─ eslint-config/
│  └─ typescript-config/
│
├─ database/
│  ├─ seed.sql
│  └─ migrations/
│
├─ docker/
│  └─ postgres/init/
├─ docker-compose.yml
│
├─ scripts/
│  ├─ seed-targets.ts
│  ├─ export-openapi.ts
│  └─ check-env.ts
│
├─ .github/workflows/
├─ scripts/
│  └─ export-openapi.ts
├─ generated/contracts/
│  ├─ openapi.json
│  └─ schemas.json
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
└─ README.md
```

---

## この構成での import ルール

これを破ると、数か月後に崩れます。

* `apps/web` → `packages/*` は可
* `apps/jobs` → `packages/*` は可
* `apps/android` → TS package は不可
* `packages/domain` → 外部 I/O 不可
* `packages/db` → `packages/domain` 依存は原則不可
* `packages/mercari` → `packages/domain`, `packages/contracts` は可
* `packages/llm` → `packages/contracts`, `packages/domain` は可
* `packages/ui` → domain/db 依存は不可

要するに、**domain を中心に inward、infra を outward** に切ります。

---

## `turbo` の持ち方

root の `turbo.json` は共通だけ持たせます。
`outputs` は package ごとに違うので、**`apps/*/turbo.json` と `packages/*/turbo.json` で上書き**するのが正解です。Turborepo は root `turbo.json` を package ごとの `turbo.json` で拡張でき、配列系は上書きになるので必要なら `$TURBO_EXTENDS$` を使います。さらに、cache したい成果物は `outputs` に宣言しないと復元されません。([Turborepo][6])

### root `turbo.json` の責務

* `build`
* `lint`
* `typecheck`
* `test`
* `dev`
* `trigger:dev`
* `db:generate`

### `apps/web/turbo.json`

* `.next/**` を `build.outputs` に設定
* `dev` は `persistent: true`, `cache: false`

### `apps/jobs/turbo.json`

* `trigger:dev` は `persistent: true`, `cache: false`
* `build` は基本軽め。実体は Trigger deploy 側
* `typecheck` / `lint` / `test` を分離

### `packages/*/turbo.json`

* `packages/contracts`, `packages/db`, `packages/domain` は `build.outputs` を `dist/**` に固定

---

## DB / migration の持ち方

ここは曖昧にすると後で揉めます。

### 正本

* **TS schema 正本**: `packages/db/src/schema`
* **SQL migration 正本**: `database/migrations`

### 実務ルール

* Drizzle schema から migration を生成
* 出力先は `database/migrations`
* RLS / extension / trigger / view / manual SQL は hand-written migration として同じ `database/migrations` に置く
* `database/seed.sql` は最低限の初期 target と role だけ

### DB client 実装ルール

* runtime 接続は `packages/db/src/client.ts` に集約し、`createDb(url: string)` を唯一の入口にする
* backend test は `packages/db/src/test.ts` の PGlite helper を使う
* migration パスは環境変数（例: `DATABASE_MIGRATIONS_PATH`）で上書き可能にする
* test helper で migration 適用済み base client をキャッシュしてよい
* repository の引数型は `packages/db/src/types.ts` の共通 `DB` 型に寄せる

この切り方にする理由は、**アプリ実装の型安全は Drizzle**、**ローカル実行は Docker Compose**、**staging/prod 反映は `DATABASE_URL` 経由の drizzle-kit**、という役割分離ができるからです。Supabase は managed Postgres の置き場としてのみ使い、実装は vendor lock-in しない形に寄せます。([Drizzle Kit][3])

---

## Trigger task の分割

`apps/jobs/trigger` には最初からこの4群だけ置けば足ります。
加えて `trigger/scheduled` に schedule エントリを集約し、定期実行の入口を一元化します。

### ingest

* `processRawEvent`
* `reprocessRawEvent`

### pricing

* `refreshDueTargets`
* `recomputeSnapshot`
* `backfillSnapshots`

### candidates

* `evaluateCandidate`
* `publishReviewState`

### ai

* `extractListingAttributes`
* `explainOutlier`

定期実行は Trigger の scheduled task に寄せます。Trigger は scheduled tasks を `/trigger` 配下に置き、declarative / imperative の両方の schedule をサポートしています。だから Vercel Cron や pg_cron を混ぜず、**定期ジョブは jobs app に一元化**した方がきれいです。([Trigger.dev][7])

---

## Android 側は本当に薄くする

ここは強く言います。
**Android を clean architecture の教材にするな**。この案件では無駄です。

`apps/android` は最初は **single app module** で十分です。

* `notification/`
* `work/`
* `network/`
* `settings/`
* `ui/`

これだけでいいです。
NotificationListenerService で拾って、WorkManager で短い再送をかけ、公開 ingest endpoint に投げる。それ以上はサーバーの責務です。Android の build は Gradle/Kotlin DSL を使います。WorkManager は immediate / long-running / deferrable work と retry を扱えます。([Android Developers][4])

---

## deploy の切り方

* **Vercel project**: `apps/web`
* **Trigger.dev project**: `apps/jobs/trigger.config.ts` を指す
  monorepo では `trigger.config.ts` の path を build settings に指定できます。([Trigger.dev][8])
* **Supabase(Postgres)**: `staging` / `production` を分離
* **Android**: APK/AAB は別配布、repo 同居のみ

[1]: https://pnpm.io/workspaces "https://pnpm.io/workspaces"
[2]: https://trigger.dev/docs/guides/example-projects/turborepo-monorepo-prisma "https://trigger.dev/docs/guides/example-projects/turborepo-monorepo-prisma"
[3]: https://orm.drizzle.team/docs/drizzle-kit-migrate "https://orm.drizzle.team/docs/drizzle-kit-migrate"
[4]: https://developer.android.com/build/gradle-build-overview "https://developer.android.com/build/gradle-build-overview"
[5]: https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package "https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package"
[6]: https://turborepo.dev/docs/reference/package-configurations "https://turborepo.dev/docs/reference/package-configurations"
[7]: https://trigger.dev/docs/tasks/scheduled "https://trigger.dev/docs/tasks/scheduled"
[8]: https://trigger.dev/changelog/github-integration "https://trigger.dev/changelog/github-integration"
