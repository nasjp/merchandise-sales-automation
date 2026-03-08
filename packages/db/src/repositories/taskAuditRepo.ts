import { desc, eq } from "drizzle-orm";
import { taskAudit, type NewTaskAudit, type TaskAudit } from "../schema";
import type { DB } from "../types";

export type InsertTaskAuditInput = Pick<
  NewTaskAudit,
  "taskName" | "runId" | "status" | "payload" | "startedAt" | "finishedAt"
>;

const insert = async (
  db: DB,
  input: InsertTaskAuditInput,
): Promise<TaskAudit> => {
  const [row] = await db
    .insert(taskAudit)
    .values({
      taskName: input.taskName,
      runId: input.runId,
      status: input.status,
      payload: input.payload ?? {},
      startedAt: input.startedAt ?? new Date(),
      finishedAt: input.finishedAt ?? null,
    })
    .returning();

  return row;
};

const markFinished = async (
  db: DB,
  input: {
    runId: string;
    status: string;
    finishedAt?: Date;
  },
): Promise<TaskAudit | null> => {
  const [row] = await db
    .update(taskAudit)
    .set({
      status: input.status,
      finishedAt: input.finishedAt ?? new Date(),
    })
    .where(eq(taskAudit.runId, input.runId))
    .returning();

  return row ?? null;
};

const findByRunId = async (db: DB, runId: string): Promise<TaskAudit | null> => {
  const [row] = await db
    .select()
    .from(taskAudit)
    .where(eq(taskAudit.runId, runId))
    .limit(1);

  return row ?? null;
};

const findRecent = async (db: DB, limit = 50): Promise<TaskAudit[]> => {
  return await db
    .select()
    .from(taskAudit)
    .orderBy(desc(taskAudit.startedAt), desc(taskAudit.createdAt))
    .limit(limit);
};

export const taskAuditRepo = {
  insert,
  markFinished,
  findByRunId,
  findRecent,
};
