# 実装 TODO（`docs/archtecture.md` ベース）

## 0. 進め方（最初に固定）
- [x] deployable を `web` / `jobs` / `android` の 3 つに固定する
- [x] `packages/shared` / `packages/common` / `packages/utils` を作らない方針を README に明記する
- [x] import ルール（`domain` は pure、`web` と `jobs` は package 経由）を lint で検証する

## 1. モノレポ土台を作る（P0）
- [x] ルートに `package.json` / `pnpm-workspace.yaml` / `turbo.json` を作成する
- [x] ディレクトリを作る: `apps/web`, `apps/jobs`, `apps/android`, `packages/*`, `supabase/*`, `scripts/*`
- [x] `packages/eslint-config`, `packages/typescript-config` を追加する
- [x] ルート scripts を定義する（`build` / `lint` / `typecheck` / `test` / `dev`）
- [x] CI ワークフロー雛形を追加する（最低: lint, typecheck, test）

完了条件:
- [x] `pnpm install` と `turbo run lint typecheck test` が通る

## 2. Turbo 設定を分離する（P0）
- [x] root `turbo.json` に共通 task（`build`, `lint`, `typecheck`, `test`, `dev`, `trigger:dev`, `db:generate`）を定義する
- [x] `apps/web/turbo.json` を追加し、`build.outputs` に `.next/**` を設定する
- [x] `apps/jobs/turbo.json` を追加し、`trigger:dev` を `persistent: true`, `cache: false` にする
- [x] 各 package の `build.outputs` を必要最低限で宣言する

完了条件:
- [x] `turbo run build` のキャッシュが期待通りに機能する

## 3. contracts/domain/db のコア package を実装する（P0）

### 3-1. `packages/contracts`
- [x] `ingest`, `targets`, `candidates`, `tasks` の Zod schema を作る
- [x] `web` と `jobs` 間の入出力型を `index.ts` から公開する
- [x] Android 連携用に JSON Schema/OpenAPI 出力スクリプト（`scripts/export-openapi.ts`）を作る

### 3-2. `packages/domain`
- [x] pricing ロジック（`computeSellEstimate`, `computeBuyLimit`, `computeLiquidityScore`）を pure function で実装する
- [x] matching ロジック（`normalizeTitle`, `normalizeModel`, `matchTarget`）を実装する
- [x] candidate 判定ロジック（`scoreCandidate`, `decideReviewState`）を実装する
- [x] 金額型・丸め・通貨処理を `money/` にまとめる

### 3-3. `packages/db`
- [x] runtime 用 `createDb(url)` を `drizzle-orm/postgres-js` + `postgres` で実装する（`prepare: false`）
- [x] test 用 `db({ migrations, cache })` helper を `drizzle-orm/pglite` + `@electric-sql/pglite` で実装する
- [x] `types.ts` に postgres/pglite + transaction を受けられる共通 `DB` 型を定義する
- [x] schema を作る（`raw_events`, `targets`, `price_snapshots`, `candidates`, `ai_runs`, `task_audit`）
- [x] repository 層を作る（rawEvents/targets/snapshots/candidates/aiRuns）
- [x] `drizzle.config.ts` の migration 出力先を `supabase/migrations` に向ける
- [x] migration パス上書き（`DATABASE_MIGRATIONS_PATH`）を test helper で扱えるようにする

完了条件:
- [x] `domain` が DB/HTTP/LLM に依存していない
- [x] `db:generate` で migration を生成できる
- [x] backend test がローカル PostgreSQL なしで実行できる

## 4. Mercari/LLM/UI package を実装する（P1）

### 4-1. `packages/mercari`
- [x] メルカリ通知 parser（タイトル/価格/状態/送料/型番抽出）を実装する
- [x] ジャンク語彙・状態語彙・送料表現を辞書化する

### 4-2. `packages/llm`
- [x] provider adapter 層を作る（将来差し替え可能な interface）
- [x] prompt template と structured output parser を実装する
- [x] 失敗時リトライ/タイムアウト/監査ログ方針を決める

### 4-3. `packages/ui`
- [x] `DataTable`, `filters`, `chart shell`, `badge` 等の primitive を実装する
- [x] feature component を入れないルールを lint/README に明記する

完了条件:
- [x] `web` 側で primitive を利用できる
- [x] LLM 実装の provider 依存が `packages/llm` に閉じている

## 5. `apps/web` を実装する（P0）
- [x] Next.js app を作成し dashboard ルート（raw-events/candidates/targets/price-snapshots/settings）を作る
- [x] ingest endpoint（`/api/ingest/android`）を実装する
- [x] candidate 操作 API（approve/reject）を実装する
- [x] target 操作 API（refresh）を実装する
- [x] Trigger run status API（`/api/trigger/runs/[runId]`）を実装する
- [x] server 層（auth/db/queries/commands/trigger client）を分離する
- [x] Android 送信元認証（HMAC など）を実装する

完了条件:
- [x] Android から送った通知が `raw_events` に保存される
- [x] 管理画面で `candidates` と `price_snapshots` を閲覧できる

## 6. `apps/jobs`（Trigger.dev）を実装する（P0）
- [x] Trigger runtime（env/logger/telemetry/factories）を作る
- [x] ingest tasks を実装する（`processRawEvent`, `reprocessRawEvent`）
- [x] pricing tasks を実装する（`refreshDueTargets`, `recomputeSnapshot`, `backfillSnapshots`）
- [x] candidates tasks を実装する（`evaluateCandidate`, `publishReviewState`）
- [x] ai tasks を実装する（`extractListingAttributes`, `explainOutlier`）
- [x] maintenance tasks を実装する（stuck run retry, artifact cleanup）
- [x] scheduled task を jobs 側に一元化する

完了条件:
- [x] `raw_event` 受信後に `candidate` 生成まで自動で流れる
- [x] 定期実行で `price_snapshots` が更新される

## 7. `apps/android` を薄く実装する（P1）
- [x] `NotificationListenerService` でメルカリ通知を捕捉する
- [x] `WorkManager` で短い再送制御を実装する
- [x] `IngestApi` + `HmacSigner` で `web` ingest API へ送信する
- [x] 設定画面（endpoint/secret）を実装する
- [x] payload は最小限（通知本文・時刻・通知元情報）に限定する

完了条件:
- [x] 通知受信から `web` 送信まで端末内フローが動作する
- [x] Android 側に SKU 判定/価格判定ロジックが存在しない

## 8. DB と migration 運用を固める（P0）
- [x] `supabase/config.toml` を整備する
- [x] `supabase/seed.sql` に最小 seed（target と role）を用意する
- [x] RLS/extension/trigger/view 用の hand-written migration 運用を決める
- [x] 内部テーブル（例: `raw_events`, `ai_runs`）の公開境界を設計する
- [x] migration 実行手順（local/staging/prod）をドキュメント化する
- [x] test 実行時の migration 読み込みルール（既定パスと `DATABASE_MIGRATIONS_PATH`）を決める

完了条件:
- [x] ローカル Supabase を起動し、schema + seed が再現できる

## 9. End-to-End データフローを完成させる（P0）
- [x] Android 通知受信 → web ingest 保存 → Trigger 実行の結線
- [x] parser/LLM による属性抽出と target マッチングを結線
- [x] snapshot 参照による candidate 評価（利益・優先度・状態）を結線
- [x] UI 上で承認/却下/再処理ができるようにする
- [x] 失敗時の再実行導線（runId 起点）を用意する

完了条件:
- [x] 1件の通知が最終的に「要レビュー」または「除外」まで遷移する

## 10. テストと品質ゲート（P0）
- [x] `packages/domain` の単体テストを整備する（境界値と回帰ケース中心）
- [x] `packages/mercari` parser のテーブル駆動テストを作る
- [x] `apps/web` API の統合テストを作る（ingest/approve/reject）
- [x] `apps/jobs` task のテスト（正常系/失敗再試行）を作る
- [x] backend の DB テスト基盤を PGlite に統一する（migration 適用込み）
- [x] PGlite の base clone + truncate 再利用を導入し、テスト時間を最適化する
- [x] import ルール違反を検知する lint ルールを入れる

完了条件:
- [ ] PR で `lint`, `typecheck`, `test` が必須化される
- [x] CI 上でも PGlite で DB テストが再現する

## 11. デプロイと運用（P1）
- [x] Vercel に `apps/web` を接続する
- [x] Trigger.dev に `apps/jobs/trigger.config.ts` を接続する
- [ ] Supabase 環境（staging/prod）を分離する
- [x] 環境変数管理（web/jobs/android）と秘密情報ローテーション手順を定義する
- [x] 監視項目（失敗率、遅延、候補生成数、承認率）を決める

完了条件:
- [ ] staging で E2E 実行し、通知からレビューまで確認できる

## 12. 初期リリース判定（MVP）
- [x] 対象 SKU の seed データを投入する
- [ ] 1週間運用して誤検知/見逃しを記録する
- [ ] score 閾値と review 優先度の基準をチューニングする
- [x] 運用手順（朝の確認、再処理、障害時対応）を Runbook 化する

MVP 完了条件:
- [ ] 「通知の自動取り込み」と「安値候補のレビュー導線」が毎日安定稼働する
- [ ] 人手レビュー時間が手作業運用より短縮される
