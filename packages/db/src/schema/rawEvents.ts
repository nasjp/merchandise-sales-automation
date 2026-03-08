import { randomUUID } from "node:crypto";
import { text, timestamp, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

export const rawEvents = pgTable(
  "raw_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    source: text("source").notNull().default("android"),
    notificationId: text("notification_id"),
    title: text("title").notNull(),
    body: text("body").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    receivedAt: timestamp("received_at", { mode: "date" }).notNull(),
    processedAt: timestamp("processed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    dedupeKeyIdx: uniqueIndex("raw_events_dedupe_key_uidx").on(table.dedupeKey),
  }),
).enableRLS();

export type RawEvent = typeof rawEvents.$inferSelect;
export type NewRawEvent = typeof rawEvents.$inferInsert;
