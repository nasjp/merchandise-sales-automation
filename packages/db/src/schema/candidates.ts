import { randomUUID } from "node:crypto";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { rawEvents } from "./rawEvents";
import { targets } from "./targets";

export const candidates = pgTable("candidates", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  rawEventId: text("raw_event_id")
    .notNull()
    .references(() => rawEvents.id, { onDelete: "cascade" }),
  targetId: text("target_id").references(() => targets.id, { onDelete: "set null" }),
  listingTitle: text("listing_title").notNull(),
  listingPriceYen: integer("listing_price_yen").notNull(),
  matchedModel: text("matched_model"),
  score: integer("score").notNull().default(0),
  reviewState: text("review_state").notNull().default("pending"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}).enableRLS();

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
