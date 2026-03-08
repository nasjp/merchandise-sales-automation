# Runbook

## 1. 朝の確認

1. 直近 24 時間の `task_audit` 失敗率を確認
2. `candidates` の `needs_review` 件数を確認
3. 遅延（受信から候補生成）を確認

## 2. 日中運用

- レビュー対象を `approved/rejected` に更新
- 不正確な候補が増えた場合は `reason` を確認
- 必要に応じて runId から再処理を実行

## 3. 再処理手順

1. `/runs` 画面で失敗 run を選ぶ
2. `Reprocess` を実行する
3. ステータスが `queued -> running -> success` へ遷移することを確認
4. `candidates` の更新を確認

## 4. 障害時対応

### ingest 401 が増加

- Android/web の secret 不一致を確認
- secret ローテーション中なら新旧切替手順を再確認

### task failed が増加

- `task_audit.payload` と `error` を確認
- DB 接続・Trigger API 接続を確認
- 一時障害なら再処理、恒久障害なら修正後再実行

### 候補が急減

- Android 通知受信状態（通知アクセス権）を確認
- `raw_events` 件数が減っていないか確認
- parser/LLM の抽出失敗率を確認

## 5. 週次レビュー

1. 承認率と見逃し件数を確認
2. score 閾値を見直す候補を抽出
3. 監視閾値が適切か調整する
