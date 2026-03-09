import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";
import { jobsLogger } from "../../src/runtime/logger";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";
import { recomputeSnapshotForTarget } from "../../src/services/pricing";

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const readOptionalString = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;

const readOptionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const recomputeSnapshot = async (input: {
  targetId: string;
  runId?: string;
}) => {
  const runId =
    input.runId ??
    (await createQueuedRun({
      taskName: "pricing.recomputeSnapshot",
      payload: {
        targetId: input.targetId,
      },
    }));
  const db = getJobsDb();

  try {
    const snapshot = await recomputeSnapshotForTarget({
      db,
      targetId: input.targetId,
    });
    const metadata = toRecord(snapshot.metadata);
    const pricingSummary = {
      pricingSource: readOptionalString(metadata.source),
      fallbackReason: readOptionalString(metadata.fallbackReason),
      sampleCount: readOptionalNumber(metadata.sampleCount),
      fetchedItemCount: readOptionalNumber(metadata.fetchedItemCount),
      selectedItemCount: readOptionalNumber(metadata.selectedItemCount),
      excludedItemCount: readOptionalNumber(metadata.excludedItemCount),
    };

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    jobsLogger.info("pricing.recomputeSnapshot completed", {
      runId,
      targetId: input.targetId,
      snapshotId: snapshot.id,
      ...pricingSummary,
    });

    return {
      runId,
      targetId: input.targetId,
      snapshotId: snapshot.id,
      status: "success" as const,
      ...pricingSummary,
    };
  } catch (error) {
    jobsLogger.error("pricing.recomputeSnapshot failed", {
      runId,
      targetId: input.targetId,
      error: toErrorMessage(error),
    });
    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "failed",
    });
    throw error;
  }
};
