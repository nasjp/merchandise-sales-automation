const json = (payload: Record<string, unknown>) => JSON.stringify(payload, null, 2);

export const ingestPrompts = {
  processRawEvent: (payload: Record<string, unknown>): string => [
    "## タスク: 生イベント処理",
    "",
    "raw_events テーブルのイベントを処理してください。",
    "",
    "### 手順:",
    "1. apps/jobs/trigger/ingest/processRawEvent.ts を確認する",
    "2. 同等のロジックを実行する",
    "3. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),

  reprocessRawEvent: (payload: Record<string, unknown>): string => [
    "## タスク: 生イベント再処理",
    "",
    "raw_events テーブルのイベントを再処理してください。",
    "",
    "### 手順:",
    "1. apps/jobs/trigger/ingest/reprocessRawEvent.ts を確認する",
    "2. 同等のロジックを実行する",
    "3. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),
};
