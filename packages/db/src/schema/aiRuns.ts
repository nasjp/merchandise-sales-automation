import { randomUUID } from "node:crypto";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { candidates } from "./candidates";

export const aiRuns = pgTable("ai_runs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  candidateId: text("candidate_id").references(() => candidates.id, {
    onDelete: "set null",
  }),
  taskName: text("task_name").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull().default("success"),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").$type<Record<string, unknown>>().notNull().default({}),
  error: text("error"),
  executedAt: timestamp("executed_at", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}).enableRLS();

export type AiRun = typeof aiRuns.$inferSelect;
export type NewAiRun = typeof aiRuns.$inferInsert;
