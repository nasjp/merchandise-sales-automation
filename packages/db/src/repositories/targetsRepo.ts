import { and, desc, eq } from "drizzle-orm";
import { targets, type NewTarget, type Target } from "../schema";
import type { DB } from "../types";

export type UpsertTargetInput = Pick<
  NewTarget,
  "id" | "sku" | "titleKeyword" | "modelKeyword" | "isActive"
>;

const upsert = async (db: DB, input: UpsertTargetInput): Promise<Target> => {
  const [row] = await db
    .insert(targets)
    .values({
      id: input.id,
      sku: input.sku,
      titleKeyword: input.titleKeyword,
      modelKeyword: input.modelKeyword,
      isActive: input.isActive,
    })
    .onConflictDoUpdate({
      target: targets.sku,
      set: {
        titleKeyword: input.titleKeyword,
        modelKeyword: input.modelKeyword,
        isActive: input.isActive,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
};

const findById = async (db: DB, id: string): Promise<Target | null> => {
  const [row] = await db.select().from(targets).where(eq(targets.id, id)).limit(1);
  return row ?? null;
};

const findActive = async (db: DB): Promise<Target[]> => {
  return await db
    .select()
    .from(targets)
    .where(and(eq(targets.isActive, true)))
    .orderBy(desc(targets.updatedAt));
};

export const targetsRepo = {
  upsert,
  findById,
  findActive,
};
