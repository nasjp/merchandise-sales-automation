import { task } from "@trigger.dev/sdk/v3";
import { repositoryLocator, JOB_TYPES } from "@merchandise/db";
import { getJobsDb } from "../src/factories/db";

const enqueue = async (
  jobType: string,
  payload: Record<string, unknown> = {},
) => {
  const db = getJobsDb();
  const job = await repositoryLocator.jobQueue.enqueue(db, {
    jobType,
    payload,
  });
  return { jobId: job.id, status: "enqueued" as const };
};

export const processRawEventTask = task({
  id: "ingest-process-raw-event",
  run: async (payload: { rawEventId: string }) =>
    enqueue(JOB_TYPES.INGEST_PROCESS_RAW_EVENT, payload),
});

export const reprocessRawEventTask = task({
  id: "ingest-reprocess-raw-event",
  run: async (payload: { rawEventId: string }) =>
    enqueue(JOB_TYPES.INGEST_REPROCESS_RAW_EVENT, payload),
});

export const refreshDueTargetsTask = task({
  id: "pricing-refresh-due-targets",
  run: async () => enqueue(JOB_TYPES.PRICING_REFRESH_DUE_TARGETS),
});

export const recomputeSnapshotTask = task({
  id: "pricing-recompute-snapshot",
  run: async (payload: { targetId: string; runId?: string }) =>
    enqueue(JOB_TYPES.PRICING_RECOMPUTE_SNAPSHOT, payload),
});

export const backfillSnapshotsTask = task({
  id: "pricing-backfill-snapshots",
  run: async (payload: { days: number }) =>
    enqueue(JOB_TYPES.PRICING_BACKFILL_SNAPSHOTS, payload),
});

export const probeMercariSoldDataTask = task({
  id: "pricing-probe-mercari",
  run: async (payload: { keyword: string; pageSize?: number; maxPages?: number }) =>
    enqueue(JOB_TYPES.PRICING_PROBE_MERCARI, payload),
});

export const evaluateCandidateTask = task({
  id: "candidates-evaluate",
  run: async (payload: {
    candidateId: string;
    listingPriceYen: number;
    buyLimitYen: number;
    liquidityScore: number;
    expectedProfitYen: number;
  }) => enqueue(JOB_TYPES.CANDIDATES_EVALUATE, payload),
});

export const publishReviewStateTask = task({
  id: "candidates-publish-review-state",
  run: async (payload: {
    candidateId: string;
    reviewState: "approved" | "rejected";
    reason?: string;
  }) => enqueue(JOB_TYPES.CANDIDATES_PUBLISH_REVIEW_STATE, payload),
});

export const notifySlackCandidateTask = task({
  id: "candidates-notify-slack",
  run: async (payload: {
    runId?: string;
    candidateId: string;
    listingTitle: string;
    listingPriceYen: number;
    score: number;
    reason?: string | null;
  }) => enqueue(JOB_TYPES.CANDIDATES_NOTIFY_SLACK, payload),
});

export const explainOutlierTask = task({
  id: "ai-explain-outlier",
  run: async (payload: Record<string, unknown>) =>
    enqueue(JOB_TYPES.AI_EXPLAIN_OUTLIER, payload),
});

export const extractListingAttributesTask = task({
  id: "ai-extract-listing-attributes",
  run: async (payload: { title: string; body: string }) =>
    enqueue(JOB_TYPES.AI_EXTRACT_LISTING_ATTRIBUTES, payload),
});

export const retryStuckRunsTask = task({
  id: "maintenance-retry-stuck-runs",
  run: async () => enqueue(JOB_TYPES.MAINTENANCE_RETRY_STUCK_RUNS),
});

export const cleanupOldArtifactsTask = task({
  id: "maintenance-cleanup-old-artifacts",
  run: async (payload: { days: number }) =>
    enqueue(JOB_TYPES.MAINTENANCE_CLEANUP_OLD_ARTIFACTS, payload),
});

export const scheduledRefreshDueTargetsTask = task({
  id: "scheduled-refresh-due-targets",
  run: async () => enqueue(JOB_TYPES.PRICING_REFRESH_DUE_TARGETS),
});

export const scheduledRetryStuckRunsTask = task({
  id: "scheduled-retry-stuck-runs",
  run: async () => enqueue(JOB_TYPES.MAINTENANCE_RETRY_STUCK_RUNS),
});

export const scheduledCleanupOldArtifactsTask = task({
  id: "scheduled-cleanup-old-artifacts",
  run: async () =>
    enqueue(JOB_TYPES.MAINTENANCE_CLEANUP_OLD_ARTIFACTS, { days: 30 }),
});
