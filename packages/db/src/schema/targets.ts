import { randomUUID } from "node:crypto";
import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const targets = pgTable(
  "targets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    sku: text("sku").notNull(),
    titleKeyword: text("title_keyword").notNull(),
    modelKeyword: text("model_keyword"),
    searchKeywordA: text("search_keyword_a"),
    searchKeywordB: text("search_keyword_b"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    skuIdx: uniqueIndex("targets_sku_uidx").on(table.sku),
  }),
).enableRLS();

export type Target = typeof targets.$inferSelect;
export type NewTarget = typeof targets.$inferInsert;
