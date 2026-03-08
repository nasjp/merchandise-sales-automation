import { repositoryLocator } from "@merchandise/db";
import { getDb } from "@/server/db";
import { queueTaskRunAndDispatch } from "@/server/trigger/client";

const REFRESH_TASK_NAME = "pricing.recomputeSnapshot";

export const queueTargetRefresh = async (targetId: string) => {
  const db = getDb();
  const target = await repositoryLocator.targets.findById(db, targetId);
  if (!target) {
    return null;
  }

  const queued = await queueTaskRunAndDispatch({
    taskName: REFRESH_TASK_NAME,
    payload: { targetId },
  });

  return {
    runId: queued.runId,
    targetId,
    taskName: REFRESH_TASK_NAME,
    status: "queued" as const,
  };
};
