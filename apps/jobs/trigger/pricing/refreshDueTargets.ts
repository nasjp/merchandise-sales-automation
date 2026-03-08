import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";
import { findDueTargetIds, recomputeSnapshotForTarget } from "../../src/services/pricing";

export const refreshDueTargets = async () => {
  const runId = await createQueuedRun({
    taskName: "pricing.refreshDueTargets",
  });
  const db = getJobsDb();

  try {
    const dueTargetIds = await findDueTargetIds({
      db,
    });

    const snapshotIds: string[] = [];
    for (const targetId of dueTargetIds) {
      const snapshot = await recomputeSnapshotForTarget({
        db,
        targetId,
      });
      snapshotIds.push(snapshot.id);
    }

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    return {
      runId,
      status: "success" as const,
      dueCount: dueTargetIds.length,
      processedTargetIds: dueTargetIds,
      snapshotIds,
    };
  } catch (error) {
    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "failed",
    });
    throw error;
  }
};
