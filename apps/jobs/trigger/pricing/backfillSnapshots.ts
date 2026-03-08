import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";
import { recomputeSnapshotForTarget } from "../../src/services/pricing";

export const backfillSnapshots = async (input: { days: number }) => {
  const runId = await createQueuedRun({
    taskName: "pricing.backfillSnapshots",
    payload: input,
  });
  const db = getJobsDb();

  try {
    const activeTargets = await repositoryLocator.targets.findActive(db);
    const days = Math.max(0, Math.floor(input.days));
    const snapshotIds: string[] = [];

    for (let offset = 0; offset < days; offset += 1) {
      const observedAt = new Date();
      observedAt.setUTCDate(observedAt.getUTCDate() - offset);

      for (const target of activeTargets) {
        const snapshot = await recomputeSnapshotForTarget({
          db,
          targetId: target.id,
          observedAt,
        });
        snapshotIds.push(snapshot.id);
      }
    }

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    return {
      runId,
      days,
      status: "success" as const,
      createdCount: snapshotIds.length,
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
