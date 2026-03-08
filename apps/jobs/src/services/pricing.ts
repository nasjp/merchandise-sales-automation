import {
  computeBuyLimit,
  computeLiquidityScore,
  computeSellEstimate,
} from "@merchandise/domain";
import { repositoryLocator, type DB, type PriceSnapshot } from "@merchandise/db";

const HOURS_24_MS = 24 * 60 * 60 * 1000;

const skuSeed = (sku: string) =>
  Array.from(sku).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const buildRecentSoldSamples = (base: number, seed: number, observedAt: Date) => {
  const daySeed = observedAt.getUTCDate() + observedAt.getUTCMonth() + 1;
  const drift = ((seed + daySeed) % 9) - 4; // -4..4
  const center = Math.max(1000, base + drift * 200);

  return [-2, -1, 0, 1, 2].map((offset) => Math.max(1000, center + offset * 300));
};

const buildSnapshotNumbers = (params: {
  sku: string;
  observedAt: Date;
  latest?: PriceSnapshot | null;
}) => {
  const seed = skuSeed(params.sku);
  const baseSell = params.latest?.sellEstimateYen ?? 35000 + (seed % 40000);
  const samples = buildRecentSoldSamples(baseSell, seed, params.observedAt);
  const sellEstimateYen = computeSellEstimate(samples);

  const soldCount30d = 8 + (seed % 16);
  const avgDaysToSell = 5 + ((seed + params.observedAt.getUTCDay()) % 10);
  const liquidityScore = computeLiquidityScore({
    soldCount30d,
    avgDaysToSell,
  });

  const buyLimitYen = computeBuyLimit({
    sellEstimateYen,
    targetMarginRate: 0.15,
    platformFeeRate: 0.1,
    shippingCostYen: 850,
  });

  return {
    sellEstimateYen,
    buyLimitYen,
    liquidityScore,
    soldCount30d,
    avgDaysToSell,
  };
};

export const recomputeSnapshotForTarget = async (params: {
  db: DB;
  targetId: string;
  observedAt?: Date;
}) => {
  const observedAt = params.observedAt ?? new Date();
  const target = await repositoryLocator.targets.findById(params.db, params.targetId);
  if (!target) {
    throw new Error(`target not found: ${params.targetId}`);
  }

  const latest = await repositoryLocator.snapshots.findLatestByTargetId(params.db, target.id);
  const numbers = buildSnapshotNumbers({
    sku: target.sku,
    observedAt,
    latest,
  });

  const snapshot = await repositoryLocator.snapshots.insert(params.db, {
    targetId: target.id,
    observedAt,
    sellEstimateYen: numbers.sellEstimateYen,
    buyLimitYen: numbers.buyLimitYen,
    liquidityScore: numbers.liquidityScore,
    metadata: {
      source: "jobs.pricing.synthetic-v1",
      soldCount30d: numbers.soldCount30d,
      avgDaysToSell: numbers.avgDaysToSell,
      basedOnSnapshotId: latest?.id ?? null,
    },
  });

  return snapshot;
};

export const findDueTargetIds = async (params: {
  db: DB;
  now?: Date;
}): Promise<string[]> => {
  const now = params.now ?? new Date();
  const activeTargets = await repositoryLocator.targets.findActive(params.db);
  const dueTargetIds: string[] = [];

  for (const target of activeTargets) {
    const latest = await repositoryLocator.snapshots.findLatestByTargetId(params.db, target.id);
    if (!latest) {
      dueTargetIds.push(target.id);
      continue;
    }

    if (now.getTime() - latest.observedAt.getTime() >= HOURS_24_MS) {
      dueTargetIds.push(target.id);
    }
  }

  return dueTargetIds;
};
