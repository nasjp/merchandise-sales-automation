import { randomUUID } from "node:crypto";
import { jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const taskAudit = pgTable(
  "task_audit",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    taskName: text("task_name").notNull(),
    runId: text("run_id").notNull(),
    status: text("status").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    runIdIdx: uniqueIndex("task_audit_run_id_uidx").on(table.runId),
  }),
).enableRLS();

export type TaskAudit = typeof taskAudit.$inferSelect;
export type NewTaskAudit = typeof taskAudit.$inferInsert;
