import { randomUUID } from "node:crypto";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const jobQueue = pgTable(
  "job_queue",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    jobType: text("job_type").notNull(),
    status: text("status").notNull().default("pending"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    result: jsonb("result").$type<Record<string, unknown>>(),
    error: text("error"),
    maxAttempts: integer("max_attempts").notNull().default(3),
    attempt: integer("attempt").notNull().default(0),
    claimedAt: timestamp("claimed_at", { mode: "date", withTimezone: true }),
    startedAt: timestamp("started_at", { mode: "date", withTimezone: true }),
    finishedAt: timestamp("finished_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    pollIdx: index("job_queue_poll_idx").on(table.status, table.createdAt),
  }),
).enableRLS();

export type JobQueue = typeof jobQueue.$inferSelect;
export type NewJobQueue = typeof jobQueue.$inferInsert;

export const JOB_TYPES = {
  INGEST_PROCESS_RAW_EVENT: "ingest.processRawEvent",
  INGEST_REPROCESS_RAW_EVENT: "ingest.reprocessRawEvent",
  PRICING_REFRESH_DUE_TARGETS: "pricing.refreshDueTargets",
  PRICING_RECOMPUTE_SNAPSHOT: "pricing.recomputeSnapshot",
  PRICING_PROBE_MERCARI: "pricing.probeMercari",
  PRICING_BACKFILL_SNAPSHOTS: "pricing.backfillSnapshots",
  CANDIDATES_EVALUATE: "candidates.evaluate",
  CANDIDATES_PUBLISH_REVIEW_STATE: "candidates.publishReviewState",
  CANDIDATES_NOTIFY_SLACK: "candidates.notifySlack",
  AI_EXPLAIN_OUTLIER: "ai.explainOutlier",
  AI_EXTRACT_LISTING_ATTRIBUTES: "ai.extractListingAttributes",
  MAINTENANCE_RETRY_STUCK_RUNS: "maintenance.retryStuckRuns",
  MAINTENANCE_CLEANUP_OLD_ARTIFACTS: "maintenance.cleanupOldArtifacts",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
