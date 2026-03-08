import { desc, eq } from "drizzle-orm";
import {
  priceSnapshots,
  type NewPriceSnapshot,
  type PriceSnapshot,
} from "../schema";
import type { DB } from "../types";

export type InsertSnapshotInput = Pick<
  NewPriceSnapshot,
  | "targetId"
  | "observedAt"
  | "sellEstimateYen"
  | "buyLimitYen"
  | "liquidityScore"
  | "metadata"
>;

const insert = async (
  db: DB,
  input: InsertSnapshotInput,
): Promise<PriceSnapshot> => {
  const [row] = await db
    .insert(priceSnapshots)
    .values({
      targetId: input.targetId,
      observedAt: input.observedAt,
      sellEstimateYen: input.sellEstimateYen,
      buyLimitYen: input.buyLimitYen,
      liquidityScore: input.liquidityScore,
      metadata: input.metadata ?? {},
    })
    .returning();

  return row;
};

const findLatestByTargetId = async (
  db: DB,
  targetId: string,
): Promise<PriceSnapshot | null> => {
  const [row] = await db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.targetId, targetId))
    .orderBy(desc(priceSnapshots.observedAt), desc(priceSnapshots.createdAt))
    .limit(1);

  return row ?? null;
};

const findRecent = async (db: DB, limit = 50): Promise<PriceSnapshot[]> => {
  return await db
    .select()
    .from(priceSnapshots)
    .orderBy(desc(priceSnapshots.observedAt), desc(priceSnapshots.createdAt))
    .limit(limit);
};

export const snapshotsRepo = {
  insert,
  findLatestByTargetId,
  findRecent,
};
