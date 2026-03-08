# Candidate Slack 通知仕様

## 1. 目的

`candidates` にレビュー対象が発生したとき、Slack に即時通知し、手動レビュー開始までのリードタイムを短縮する。

## 2. スコープ

- 対象アプリ:
  - `apps/web`: candidate 作成と通知ジョブ投入
  - `apps/jobs`: Slack 送信
- 対象イベント:
  - Android ingest 経由で新規 `candidate` が作成されたとき

## 3. 通知条件

- 通知する条件:
  - `candidate.reviewState === "needs_review"`
- 通知しない条件:
  - `excluded` / `pending` / `approved` / `rejected`
  - dedupe で新規 candidate が作成されなかったケース

## 4. 処理フロー

1. `apps/web` が ingest を受け取り `candidate` を生成する。
2. `candidate.reviewState` が `needs_review` の場合のみ、`candidates.notifySlack` をキュー投入する。
3. Trigger.dev の `candidates-notify-slack` task (`apps/jobs`) が Slack API を実行する。
4. 送信成否は `task_audit` で追跡する。

補足:

- Slack 通知失敗は candidate 生成の成功/失敗に影響させない（通知は非同期・非ブロッキング）。

## 5. Slack 通知メッセージ仕様

最低限、以下を含める。

- Candidate ID
- タイトル (`listingTitle`)
- 出品価格 (`listingPriceYen`)
- スコア (`score`)
- 判定理由 (`reason`)
- 詳細URL（必須・絶対 URL）

メッセージ例:

```text
[Candidate needs_review]
title: PlayStation 5 CFI-2000 本体
price: 49,800円
score: 78
reason: match:model,llm:success,snapshot:available
detail: https://<host>/candidates/<candidateId>
```

## 6. 詳細URL要件（必須）

- Slack へ送る詳細URLは絶対 URL でなければならない。
- 形式は `https://.../candidates/{candidateId}` を正とする。
- 相対パス（`/candidates/{id}`）は送信しない。
- URL を組み立てる基底値は `WEB_BASE_URL` を使用する。
- `WEB_BASE_URL` が未設定、または不正な URL の場合は task を `failed` とする。

## 7. 環境変数（apps/jobs）

- `SLACK_BOT_TOKEN`（必須）: Bot token (`xoxb-...`)
- `SLACK_CHANNEL_NAME`（必須）: 投稿先チャネル名（例: `candidate-alerts`）
- `SLACK_SIGNING_SECRET`（必須）: 将来の inbound 検証用。現時点では outbound 送信自体には未使用
- `WEB_BASE_URL`（必須）: 詳細URL生成に使用する Web の公開ベース URL（例: `https://merchandise.example.com`）

## 8. エラーハンドリング

- Slack API 応答がエラーの場合:
  - task を `failed` とし、エラー内容をログに記録する
- channel 解決不可 / 認証失敗:
  - task を `failed` とし再実行対象にする

## 9. 今回の設計決定

- 通知対象は `needs_review` のみ
- 詳細URLは必ず絶対 URL を含める
