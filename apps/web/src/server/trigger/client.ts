import { randomUUID } from "node:crypto";
import { repositoryLocator } from "@merchandise/db";
import { getDb } from "@/server/db";

type QueueTaskRunInput = {
  taskName: string;
  runId?: string;
  payload?: Record<string, unknown>;
};

export const queueTaskRun = async (input: QueueTaskRunInput) => {
  const db = getDb();
  const runId = input.runId ?? `run_${randomUUID()}`;

  return await repositoryLocator.taskAudit.insert(db, {
    taskName: input.taskName,
    runId,
    status: "queued",
    payload: input.payload ?? {},
    startedAt: new Date(),
    finishedAt: null,
  });
};

export const findTaskRun = async (runId: string) => {
  const db = getDb();
  return await repositoryLocator.taskAudit.findByRunId(db, runId);
};

export const markTaskRunFinished = async (params: {
  runId: string;
  status: "success" | "failed";
}) => {
  const db = getDb();
  return await repositoryLocator.taskAudit.markFinished(db, {
    runId: params.runId,
    status: params.status,
    finishedAt: new Date(),
  });
};

export const requeueTaskRun = async (baseRunId: string) => {
  const current = await findTaskRun(baseRunId);
  if (!current) {
    return null;
  }

  const queued = await queueTaskRun({
    taskName: current.taskName,
    payload: {
      ...current.payload,
      requeuedFromRunId: baseRunId,
    },
  });

  return {
    runId: queued.runId,
    requeuedFromRunId: baseRunId,
    taskName: queued.taskName,
    status: "queued" as const,
  };
};
