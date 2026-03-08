import { randomUUID } from "node:crypto";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { targets } from "./targets";

export const priceSnapshots = pgTable("price_snapshots", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  targetId: text("target_id")
    .notNull()
    .references(() => targets.id, { onDelete: "cascade" }),
  observedAt: timestamp("observed_at", { mode: "date" }).defaultNow().notNull(),
  sellEstimateYen: integer("sell_estimate_yen").notNull(),
  buyLimitYen: integer("buy_limit_yen").notNull(),
  liquidityScore: integer("liquidity_score").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
}).enableRLS();

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type NewPriceSnapshot = typeof priceSnapshots.$inferInsert;
