import { createQueuedRun } from "../../src/task-helpers/taskAudit";

export const cleanupOldArtifacts = async (input: { days: number }) => {
  const runId = await createQueuedRun({
    taskName: "maintenance.cleanupOldArtifacts",
    payload: input,
  });

  return {
    runId,
    status: "queued" as const,
    days: input.days,
  };
};
