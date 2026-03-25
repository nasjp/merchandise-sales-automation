const json = (payload: Record<string, unknown>) => JSON.stringify(payload, null, 2);

export const maintenancePrompts = {
  retryStuckRuns: (_payload: Record<string, unknown>): string => [
    "## タスク: 停滞ジョブの再試行",
    "",
    "job_queue テーブルで claimed/running のまま長時間経過したジョブを pending に戻してください。",
    "",
    "### 手順:",
    "1. packages/db のスキーマを確認する",
    "2. claimed_at が10分以上前の claimed/running ジョブを pending に戻す",
    "3. 結果を JSON で報告する",
  ].join("\n"),

  cleanupOldArtifacts: (payload: Record<string, unknown>): string => [
    "## タスク: 古いデータのクリーンアップ",
    "",
    `${payload.days ?? 30} 日以上前の完了済み/dead ジョブと古い task_audit レコードを削除してください。`,
    "",
    "### 手順:",
    "1. packages/db のリポジトリを使って古いデータを削除する",
    "2. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),
};
