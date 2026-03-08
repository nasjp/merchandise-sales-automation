import { task } from "@trigger.dev/sdk/v3";
import { explainOutlier } from "./ai/explainOutlier";
import { extractListingAttributes } from "./ai/extractListingAttributes";
import { evaluateCandidate } from "./candidates/evaluateCandidate";
import { publishReviewState } from "./candidates/publishReviewState";
import { processRawEvent } from "./ingest/processRawEvent";
import { reprocessRawEvent } from "./ingest/reprocessRawEvent";
import { cleanupOldArtifacts } from "./maintenance/cleanupOldArtifacts";
import { retryStuckRuns } from "./maintenance/retryStuckRuns";
import { backfillSnapshots } from "./pricing/backfillSnapshots";
import { recomputeSnapshot } from "./pricing/recomputeSnapshot";
import { refreshDueTargets } from "./pricing/refreshDueTargets";
import {
  scheduledCleanupOldArtifacts,
  scheduledRefreshDueTargets,
  scheduledRetryStuckRuns,
} from "./scheduled";

export const processRawEventTask = task({
  id: "ingest-process-raw-event",
  run: async (payload: { rawEventId: string }) => await processRawEvent(payload),
});

export const reprocessRawEventTask = task({
  id: "ingest-reprocess-raw-event",
  run: async (payload: { rawEventId: string }) =>
    await reprocessRawEvent(payload),
});

export const refreshDueTargetsTask = task({
  id: "pricing-refresh-due-targets",
  run: async () => await refreshDueTargets(),
});

export const recomputeSnapshotTask = task({
  id: "pricing-recompute-snapshot",
  run: async (payload: { targetId: string; runId?: string }) =>
    await recomputeSnapshot(payload),
});

export const backfillSnapshotsTask = task({
  id: "pricing-backfill-snapshots",
  run: async (payload: { days: number }) => await backfillSnapshots(payload),
});

export const evaluateCandidateTask = task({
  id: "candidates-evaluate",
  run: async (payload: {
    candidateId: string;
    listingPriceYen: number;
    buyLimitYen: number;
    liquidityScore: number;
    expectedProfitYen: number;
  }) => await evaluateCandidate(payload),
});

export const publishReviewStateTask = task({
  id: "candidates-publish-review-state",
  run: async (payload: {
    candidateId: string;
    reviewState: "approved" | "rejected";
    reason?: string;
  }) => await publishReviewState(payload),
});

export const explainOutlierTask = task({
  id: "ai-explain-outlier",
  run: async (payload: Record<string, unknown>) => await explainOutlier(payload),
});

export const extractListingAttributesTask = task({
  id: "ai-extract-listing-attributes",
  run: async (payload: { title: string; body: string }) =>
    await extractListingAttributes(payload),
});

export const retryStuckRunsTask = task({
  id: "maintenance-retry-stuck-runs",
  run: async () => await retryStuckRuns(),
});

export const cleanupOldArtifactsTask = task({
  id: "maintenance-cleanup-old-artifacts",
  run: async (payload: { days: number }) => await cleanupOldArtifacts(payload),
});

export const scheduledRefreshDueTargetsTask = task({
  id: "scheduled-refresh-due-targets",
  run: async () => await scheduledRefreshDueTargets(),
});

export const scheduledRetryStuckRunsTask = task({
  id: "scheduled-retry-stuck-runs",
  run: async () => await scheduledRetryStuckRuns(),
});

export const scheduledCleanupOldArtifactsTask = task({
  id: "scheduled-cleanup-old-artifacts",
  run: async () => await scheduledCleanupOldArtifacts(),
});
