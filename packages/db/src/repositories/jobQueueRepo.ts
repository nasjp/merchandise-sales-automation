import { and, asc, eq, lte, sql } from "drizzle-orm";
import { jobQueue, type JobQueue, type NewJobQueue } from "../schema";
import type { DB } from "../types";

export type EnqueueInput = Pick<NewJobQueue, "jobType" | "payload"> &
  Partial<Pick<NewJobQueue, "maxAttempts">>;

const enqueue = async (db: DB, input: EnqueueInput): Promise<JobQueue> => {
  const [row] = await db
    .insert(jobQueue)
    .values({
      jobType: input.jobType,
      payload: input.payload ?? {},
      maxAttempts: input.maxAttempts ?? 3,
    })
    .returning();

  return row;
};

const claimNext = async (db: DB): Promise<JobQueue | null> => {
  const result = await db.execute(sql`
    UPDATE job_queue
    SET status = 'claimed', claimed_at = NOW(), attempt = attempt + 1
    WHERE id = (
      SELECT id FROM job_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);

  const rows = Array.isArray(result) ? result : Array.from(result as unknown as ArrayLike<unknown>);
  if (rows.length === 0) return null;

  const row = rows[0] as Record<string, unknown>;
  return {
    id: row.id as string,
    jobType: row.job_type as string,
    status: row.status as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
    result: row.result as Record<string, unknown> | null,
    error: row.error as string | null,
    maxAttempts: row.max_attempts as number,
    attempt: row.attempt as number,
    claimedAt: row.claimed_at ? new Date(row.claimed_at as string) : null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    finishedAt: row.finished_at ? new Date(row.finished_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
};

const markRunning = async (db: DB, id: string): Promise<void> => {
  await db
    .update(jobQueue)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(jobQueue.id, id));
};

const markCompleted = async (
  db: DB,
  id: string,
  result: Record<string, unknown>,
): Promise<void> => {
  await db
    .update(jobQueue)
    .set({ status: "completed", result, finishedAt: new Date() })
    .where(eq(jobQueue.id, id));
};

const markFailed = async (
  db: DB,
  id: string,
  error: string,
): Promise<void> => {
  const [row] = await db
    .select({ attempt: jobQueue.attempt, maxAttempts: jobQueue.maxAttempts })
    .from(jobQueue)
    .where(eq(jobQueue.id, id))
    .limit(1);

  if (!row) return;

  const nextStatus = row.attempt >= row.maxAttempts ? "dead" : "pending";

  await db
    .update(jobQueue)
    .set({ status: nextStatus, error, finishedAt: new Date() })
    .where(eq(jobQueue.id, id));
};

const findPending = async (db: DB, limit = 50): Promise<JobQueue[]> => {
  return await db
    .select()
    .from(jobQueue)
    .where(eq(jobQueue.status, "pending"))
    .orderBy(asc(jobQueue.createdAt))
    .limit(limit);
};

const cleanupOld = async (db: DB, days: number): Promise<number> => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .delete(jobQueue)
    .where(
      and(
        sql`${jobQueue.status} IN ('completed', 'dead')`,
        lte(jobQueue.createdAt, cutoff),
      ),
    )
    .returning();

  return rows.length;
};

export const jobQueueRepo = {
  enqueue,
  claimNext,
  markRunning,
  markCompleted,
  markFailed,
  findPending,
  cleanupOld,
};
