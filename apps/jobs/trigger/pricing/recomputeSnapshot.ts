import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";
import { recomputeSnapshotForTarget } from "../../src/services/pricing";

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

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    return {
      runId,
      targetId: input.targetId,
      snapshotId: snapshot.id,
      status: "success" as const,
    };
  } catch (error) {
    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "failed",
    });
    throw error;
  }
};
