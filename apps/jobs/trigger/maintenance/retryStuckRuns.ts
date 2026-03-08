import { createQueuedRun } from "../../src/task-helpers/taskAudit";

export const retryStuckRuns = async () => {
  const runId = await createQueuedRun({
    taskName: "maintenance.retryStuckRuns",
  });

  return {
    runId,
    status: "queued" as const,
  };
};
