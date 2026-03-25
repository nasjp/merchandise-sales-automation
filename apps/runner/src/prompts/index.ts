import type { JobQueue, JobType } from "@merchandise/db";
import { JOB_TYPES } from "@merchandise/db";
import { pricingPrompts } from "./pricing";
import { candidatesPrompts } from "./candidates";
import { aiPrompts } from "./ai";
import { ingestPrompts } from "./ingest";
import { maintenancePrompts } from "./maintenance";

const promptBuilders: Record<
  JobType,
  (payload: Record<string, unknown>) => string
> = {
  [JOB_TYPES.PRICING_REFRESH_DUE_TARGETS]: pricingPrompts.refreshDueTargets,
  [JOB_TYPES.PRICING_RECOMPUTE_SNAPSHOT]: pricingPrompts.recomputeSnapshot,
  [JOB_TYPES.PRICING_PROBE_MERCARI]: pricingPrompts.probeMercari,
  [JOB_TYPES.PRICING_BACKFILL_SNAPSHOTS]: pricingPrompts.backfillSnapshots,
  [JOB_TYPES.CANDIDATES_EVALUATE]: candidatesPrompts.evaluate,
  [JOB_TYPES.CANDIDATES_PUBLISH_REVIEW_STATE]: candidatesPrompts.publishReviewState,
  [JOB_TYPES.CANDIDATES_NOTIFY_SLACK]: candidatesPrompts.notifySlack,
  [JOB_TYPES.AI_EXPLAIN_OUTLIER]: aiPrompts.explainOutlier,
  [JOB_TYPES.AI_EXTRACT_LISTING_ATTRIBUTES]: aiPrompts.extractListingAttributes,
  [JOB_TYPES.INGEST_PROCESS_RAW_EVENT]: ingestPrompts.processRawEvent,
  [JOB_TYPES.INGEST_REPROCESS_RAW_EVENT]: ingestPrompts.reprocessRawEvent,
  [JOB_TYPES.MAINTENANCE_RETRY_STUCK_RUNS]: maintenancePrompts.retryStuckRuns,
  [JOB_TYPES.MAINTENANCE_CLEANUP_OLD_ARTIFACTS]: maintenancePrompts.cleanupOldArtifacts,
};

export const buildSystemPrompt = (_job: JobQueue): string => {
  return [
    "あなたは merchandise-sales-automation プロジェクトのジョブ実行エージェントです。",
    "このプロジェクトのコードを読み、必要な処理を実行してください。",
    "",
    "ルール:",
    "- packages/db, packages/domain, packages/mercari のコードを活用すること",
    "- DB操作は npx tsx でTypeScriptスクリプトを直接実行すること",
    "- 環境変数 DATABASE_URL でDBに接続可能",
    "- 結果は必ず最後に JSON コードブロックで出力すること:",
    '  成功時: ```json\\n{"status":"success", ...}\\n```',
    '  失敗時: ```json\\n{"status":"error", "message":"..."}\\n```',
    "- 不要なファイルを作成しないこと。一時スクリプトが必要な場合は実行後に削除すること",
  ].join("\n");
};

export const buildPrompt = (job: JobQueue): string => {
  const builder = promptBuilders[job.jobType as JobType];
  if (!builder) {
    return `不明なジョブタイプ: ${job.jobType}\nペイロード: ${JSON.stringify(job.payload)}\n\nこのジョブタイプに適した処理を推測して実行してください。`;
  }
  return builder(job.payload);
};
