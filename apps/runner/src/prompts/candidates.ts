const json = (payload: Record<string, unknown>) => JSON.stringify(payload, null, 2);

export const candidatesPrompts = {
  evaluate: (payload: Record<string, unknown>): string => [
    "## タスク: 候補の評価",
    "",
    "候補のスコアを算出し、レビュー状態を判定してください。",
    "",
    "### 手順:",
    "1. apps/jobs/trigger/candidates/evaluateCandidate.ts を確認する",
    "2. packages/domain のスコア計算ロジックを使ってスコアを算出する",
    "3. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),

  publishReviewState: (payload: Record<string, unknown>): string => [
    "## タスク: レビュー状態の確定",
    "",
    "候補のレビュー状態を approved/rejected に確定してください。",
    "",
    "### 手順:",
    "1. apps/jobs/trigger/candidates/publishReviewState.ts を確認する",
    "2. DBの candidates テーブルを更新する",
    "3. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),

  notifySlack: (payload: Record<string, unknown>): string => [
    "## タスク: Slack通知",
    "",
    "候補の情報を Slack チャネルに通知してください。",
    "",
    "### 手順:",
    "1. apps/jobs/trigger/candidates/notifySlackCandidate.ts を確認する",
    "2. apps/jobs/src/services/slack.ts のSlackサービスを使って通知を送信する",
    "3. 結果を JSON で報告する",
    "",
    `ペイロード: ${json(payload)}`,
  ].join("\n"),
};
