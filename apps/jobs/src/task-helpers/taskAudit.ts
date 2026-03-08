import { repositoryLocator } from "@merchandise/db";
import { randomUUID } from "node:crypto";
import { getJobsDb } from "../factories/db";

type CreateQueuedRunDeps = {
  insertTaskAudit: typeof repositoryLocator.taskAudit.insert;
  getDb: typeof getJobsDb;
};

const defaultDeps: CreateQueuedRunDeps = {
  insertTaskAudit: repositoryLocator.taskAudit.insert,
  getDb: getJobsDb,
};

export const createQueuedRun = async (params: {
  taskName: string;
  payload?: Record<string, unknown>;
  retries?: number;
  deps?: CreateQueuedRunDeps;
}) => {
  const deps = params.deps ?? defaultDeps;
  const db = deps.getDb();
  const runId = `job_${randomUUID()}`;
  const retries = Math.max(0, params.retries ?? 2);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await deps.insertTaskAudit(db, {
        taskName: params.taskName,
        runId,
        status: "queued",
        payload: params.payload ?? {},
        startedAt: new Date(),
      });
      return runId;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};
