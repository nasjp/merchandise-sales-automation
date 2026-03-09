import {
  computeBuyLimit,
  computeLiquidityScore,
  computeSellEstimate,
} from "@merchandise/domain";
import {
  repositoryLocator,
  type DB,
  type PriceSnapshot,
  type Target,
} from "@merchandise/db";
import {
  createMercariApiClient,
  type MercariSearchItem,
} from "@merchandise/mercari";
import {
  PricingClassificationError,
  classifyPricingCandidates,
  type PricingCandidateForClassifier,
} from "./pricingItemClassifier";

const HOURS_24_MS = 24 * 60 * 60 * 1000;
const DAYS_30_MS = 30 * HOURS_24_MS;
const DAYS_120_MS = 120 * HOURS_24_MS;
const DEFAULT_MERCARI_MIN_SAMPLE_COUNT = 8;
const DEFAULT_MERCARI_PAGE_SIZE = 80;
const DEFAULT_MERCARI_MAX_PAGES = 2;
const DEFAULT_MERCARI_TIMEOUT_MS = 8_000;
const DEFAULT_MERCARI_MAX_RETRIES = 2;
const DEFAULT_MERCARI_RETRY_BASE_DELAY_MS = 300;
const DEFAULT_PRICING_CLASSIFIER_TIMEOUT_MS = 12_000;
const DEFAULT_PRICING_CLASSIFIER_BATCH_SIZE = 25;
const DEFAULT_PRICING_CLASSIFIER_MAX_ITEMS = 120;
const DEFAULT_PRICING_CLASSIFIER_MIN_CONFIDENCE = 0.6;
const DEFAULT_PRICING_CLASSIFIER_MODEL = "gpt-5.4-2026-03-05";

const TARGET_MARGIN_RATE = 0.15;
const PLATFORM_FEE_RATE = 0.1;
const SHIPPING_COST_YEN = 850;

const readBoundedIntEnv = (params: {
  name: string;
  fallback: number;
  min: number;
  max: number;
}) => {
  const raw = process.env[params.name];
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return params.fallback;
  }

  return Math.max(params.min, Math.min(params.max, parsed));
};

const readBoundedFloatEnv = (params: {
  name: string;
  fallback: number;
  min: number;
  max: number;
}) => {
  const raw = process.env[params.name];
  const parsed = Number.parseFloat(raw ?? "");
  if (!Number.isFinite(parsed)) {
    return params.fallback;
  }

  return Math.max(params.min, Math.min(params.max, parsed));
};

const MERCARI_MIN_SAMPLE_COUNT = readBoundedIntEnv({
  name: "PRICING_MERCARI_MIN_SAMPLE_COUNT",
  fallback: DEFAULT_MERCARI_MIN_SAMPLE_COUNT,
  min: 3,
  max: 50,
});

const MERCARI_PAGE_SIZE = readBoundedIntEnv({
  name: "PRICING_MERCARI_PAGE_SIZE",
  fallback: DEFAULT_MERCARI_PAGE_SIZE,
  min: 10,
  max: 120,
});

const MERCARI_MAX_PAGES = readBoundedIntEnv({
  name: "PRICING_MERCARI_MAX_PAGES",
  fallback: DEFAULT_MERCARI_MAX_PAGES,
  min: 1,
  max: 5,
});

const PRICING_CLASSIFIER_TIMEOUT_MS = readBoundedIntEnv({
  name: "PRICING_CLASSIFIER_TIMEOUT_MS",
  fallback: DEFAULT_PRICING_CLASSIFIER_TIMEOUT_MS,
  min: 1_000,
  max: 60_000,
});

const PRICING_CLASSIFIER_BATCH_SIZE = readBoundedIntEnv({
  name: "PRICING_CLASSIFIER_BATCH_SIZE",
  fallback: DEFAULT_PRICING_CLASSIFIER_BATCH_SIZE,
  min: 1,
  max: 80,
});

const PRICING_CLASSIFIER_MAX_ITEMS = readBoundedIntEnv({
  name: "PRICING_CLASSIFIER_MAX_ITEMS",
  fallback: DEFAULT_PRICING_CLASSIFIER_MAX_ITEMS,
  min: 1,
  max: 300,
});

const PRICING_CLASSIFIER_MIN_CONFIDENCE = readBoundedFloatEnv({
  name: "PRICING_CLASSIFIER_MIN_CONFIDENCE",
  fallback: DEFAULT_PRICING_CLASSIFIER_MIN_CONFIDENCE,
  min: 0,
  max: 1,
});

const PRICING_CLASSIFIER_MODEL =
  process.env.PRICING_CLASSIFIER_MODEL?.trim() || DEFAULT_PRICING_CLASSIFIER_MODEL;

const mercariClient = createMercariApiClient({
  requestTimeoutMs: readBoundedIntEnv({
    name: "PRICING_MERCARI_TIMEOUT_MS",
    fallback: DEFAULT_MERCARI_TIMEOUT_MS,
    min: 1_000,
    max: 30_000,
  }),
  maxRetries: readBoundedIntEnv({
    name: "PRICING_MERCARI_MAX_RETRIES",
    fallback: DEFAULT_MERCARI_MAX_RETRIES,
    min: 0,
    max: 5,
  }),
  retryBaseDelayMs: readBoundedIntEnv({
    name: "PRICING_MERCARI_RETRY_BASE_DELAY_MS",
    fallback: DEFAULT_MERCARI_RETRY_BASE_DELAY_MS,
    min: 50,
    max: 5_000,
  }),
});

const skuSeed = (sku: string) =>
  Array.from(sku).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

const buildRecentSoldSamples = (base: number, seed: number, observedAt: Date) => {
  const daySeed = observedAt.getUTCDate() + observedAt.getUTCMonth() + 1;
  const drift = ((seed + daySeed) % 9) - 4; // -4..4
  const center = Math.max(1000, base + drift * 200);

  return [-2, -1, 0, 1, 2].map((offset) => Math.max(1000, center + offset * 300));
};

type SnapshotNumbers = {
  sellEstimateYen: number;
  buyLimitYen: number;
  liquidityScore: number;
  soldCount30d: number;
  avgDaysToSell: number;
  metadata: Record<string, unknown>;
};

const buildSyntheticSnapshotNumbers = (params: {
  sku: string;
  observedAt: Date;
  latest?: PriceSnapshot | null;
}): SnapshotNumbers => {
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
    targetMarginRate: TARGET_MARGIN_RATE,
    platformFeeRate: PLATFORM_FEE_RATE,
    shippingCostYen: SHIPPING_COST_YEN,
  });

  return {
    sellEstimateYen,
    buyLimitYen,
    liquidityScore,
    soldCount30d,
    avgDaysToSell,
    metadata: {
      source: "jobs.pricing.synthetic-v1",
      basedOnSnapshotId: params.latest?.id ?? null,
    },
  };
};

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const normalizeText = (value: string) =>
  value.normalize("NFKC").replace(/[_\s-]+/g, " ").trim();

const tokenizeKeyword = (value: string) =>
  normalizeText(value)
    .toLowerCase()
    .split(" ")
    .filter((token) => token.length > 0);

const isNoisyCompactModelToken = (token: string) => {
  const hasLetters = /[a-z]/i.test(token);
  const hasDigits = /\d/.test(token);
  if (!hasLetters || !hasDigits) {
    return false;
  }

  if (token.length >= 11) {
    return true;
  }

  return /(mmgps|mmcellular|gps|cellular|simfree|gb)$/i.test(token);
};

const buildModelTokensForKeyword = (modelKeyword: string | null) => {
  if (!modelKeyword) {
    return [] as string[];
  }

  const tokens = tokenizeKeyword(modelKeyword);
  if (tokens.length === 0) {
    return tokens;
  }

  return tokens.filter((token) => !isNoisyCompactModelToken(token));
};

const buildMercariKeyword = (target: Target) => {
  const rawTokens = [
    ...tokenizeKeyword(target.titleKeyword),
    ...buildModelTokensForKeyword(target.modelKeyword ?? null),
    ...tokenizeKeyword(target.sku),
  ];

  const dedupedTokens = Array.from(new Set(rawTokens));
  return dedupedTokens.join(" ");
};

const parsePositiveInt = (value: string | undefined) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const filterSoldOutMercariItems = (items: MercariSearchItem[]) =>
  items.filter(
    (item) =>
      item.status === "ITEM_STATUS_SOLD_OUT" &&
      item.itemType === "ITEM_TYPE_MERCARI",
  );

const scopeItemsByModelKeyword = (items: MercariSearchItem[], modelKeyword: string | null) => {
  const normalizedModel = normalizeText(modelKeyword ?? "").toLowerCase();
  if (!normalizedModel) {
    return items;
  }

  const filtered = items.filter((item) =>
    normalizeText(item.name).toLowerCase().includes(normalizedModel),
  );
  return filtered.length >= MERCARI_MIN_SAMPLE_COUNT ? filtered : items;
};

const extractSoldPriceSamples = (items: MercariSearchItem[]) =>
  items
    .map((item) => parsePositiveInt(item.price))
    .filter((value): value is number => value !== null);

const toPricingCandidates = (
  items: MercariSearchItem[],
): PricingCandidateForClassifier[] =>
  items.flatMap((item) => {
    const priceYen = parsePositiveInt(item.price);
    if (!priceYen) {
      return [];
    }
    return [
      {
        id: item.id,
        name: item.name,
        priceYen,
      },
    ];
  });

const countExcludedReasons = (
  decisions: Array<{ include: boolean; reason: string }>,
) => {
  const counts: Record<string, number> = {};
  for (const decision of decisions) {
    if (decision.include) {
      continue;
    }
    counts[decision.reason] = (counts[decision.reason] ?? 0) + 1;
  }
  return counts;
};

const getSoldAtMs = (item: MercariSearchItem) => {
  const updated = parsePositiveInt(item.updated);
  if (updated) {
    return updated * 1000;
  }

  const created = parsePositiveInt(item.created);
  return created ? created * 1000 : null;
};

const computeSoldCount30d = (items: MercariSearchItem[], observedAt: Date) => {
  const since = observedAt.getTime() - DAYS_30_MS;
  return items.filter((item) => {
    const soldAtMs = getSoldAtMs(item);
    return soldAtMs !== null && soldAtMs >= since && soldAtMs <= observedAt.getTime();
  }).length;
};

const computeAvgDaysToSell = (items: MercariSearchItem[]) => {
  const durations = items
    .map((item) => {
      const created = parsePositiveInt(item.created);
      const soldAt = parsePositiveInt(item.updated) ?? created;
      if (!created || !soldAt || soldAt < created) {
        return null;
      }

      const diffMs = (soldAt - created) * 1000;
      if (diffMs > DAYS_120_MS) {
        return null;
      }
      return diffMs / HOURS_24_MS;
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) {
    return null;
  }

  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return Math.max(1, Math.round(average));
};

const buildMercariSnapshotNumbers = async (params: {
  target: Target;
  observedAt: Date;
}): Promise<SnapshotNumbers | null> => {
  const keyword = buildMercariKeyword(params.target);
  if (!keyword) {
    return null;
  }

  const result = await mercariClient.searchSoldItems({
    keyword,
    pageSize: MERCARI_PAGE_SIZE,
    maxPages: MERCARI_MAX_PAGES,
  });

  const soldOutItems = filterSoldOutMercariItems(result.items);
  const scopedItems = scopeItemsByModelKeyword(
    soldOutItems,
    params.target.modelKeyword ?? null,
  );
  const candidateItems = toPricingCandidates(scopedItems);

  const classification = await classifyPricingCandidates({
    target: {
      sku: params.target.sku,
      titleKeyword: params.target.titleKeyword,
      modelKeyword: params.target.modelKeyword ?? null,
    },
    items: candidateItems,
    openAiApiKey: process.env.OPENAI_API_KEY ?? null,
    model: PRICING_CLASSIFIER_MODEL,
    requireLlm: true,
    minConfidence: PRICING_CLASSIFIER_MIN_CONFIDENCE,
    maxItems: PRICING_CLASSIFIER_MAX_ITEMS,
    batchSize: PRICING_CLASSIFIER_BATCH_SIZE,
    timeoutMs: PRICING_CLASSIFIER_TIMEOUT_MS,
  });

  const includedIdSet = new Set(classification.includedIds);
  const filteredItems = scopedItems.filter((item) => includedIdSet.has(item.id));
  const soldPriceSamples = extractSoldPriceSamples(filteredItems);

  if (soldPriceSamples.length < MERCARI_MIN_SAMPLE_COUNT) {
    return null;
  }

  const sellEstimateYen = computeSellEstimate(soldPriceSamples);
  if (sellEstimateYen <= 0) {
    return null;
  }

  const soldCount30d = computeSoldCount30d(filteredItems, params.observedAt);
  const avgDaysToSell = computeAvgDaysToSell(filteredItems) ?? 14;
  const liquidityScore = computeLiquidityScore({
    soldCount30d,
    avgDaysToSell,
  });

  const buyLimitYen = computeBuyLimit({
    sellEstimateYen,
    targetMarginRate: TARGET_MARGIN_RATE,
    platformFeeRate: PLATFORM_FEE_RATE,
    shippingCostYen: SHIPPING_COST_YEN,
  });

  return {
    sellEstimateYen,
    buyLimitYen,
    liquidityScore,
    soldCount30d,
    avgDaysToSell,
    metadata: {
      source: "jobs.pricing.mercari-v1",
      keyword,
      sampleCount: soldPriceSamples.length,
      fetchedItemCount: soldOutItems.length,
      selectedItemCount: filteredItems.length,
      candidateItemCount: candidateItems.length,
      excludedItemCount: classification.excludedIds.length,
      classifierUsedLlm: classification.usedLlm,
      classifierModel: PRICING_CLASSIFIER_MODEL,
      classifierMinConfidence: PRICING_CLASSIFIER_MIN_CONFIDENCE,
      classifierExcludedReasons: countExcludedReasons(classification.decisions),
      fetchedPageCount: result.pageCount,
      nextPageToken: result.nextPageToken,
      pageSize: MERCARI_PAGE_SIZE,
      maxPages: MERCARI_MAX_PAGES,
      minSampleCount: MERCARI_MIN_SAMPLE_COUNT,
    },
  };
};

type PricingSourceMode = "auto" | "mercari" | "synthetic";

const readPricingSourceMode = (): PricingSourceMode => {
  const configured = process.env.PRICING_SOURCE?.toLowerCase();
  if (configured === "auto" || configured === "mercari" || configured === "synthetic") {
    return configured;
  }

  return process.env.NODE_ENV === "test" ? "synthetic" : "auto";
};

const buildSnapshotNumbers = async (params: {
  target: Target;
  observedAt: Date;
  latest?: PriceSnapshot | null;
}): Promise<SnapshotNumbers> => {
  const mode = readPricingSourceMode();
  if (mode !== "synthetic") {
    try {
      const mercari = await buildMercariSnapshotNumbers({
        target: params.target,
        observedAt: params.observedAt,
      });
      if (mercari) {
        return mercari;
      }
    } catch (error) {
      if (error instanceof PricingClassificationError) {
        throw error;
      }
      if (mode === "mercari") {
        throw new Error(`mercari pricing failed: ${toErrorMessage(error)}`);
      }
      const synthetic = buildSyntheticSnapshotNumbers({
        sku: params.target.sku,
        observedAt: params.observedAt,
        latest: params.latest,
      });
      return {
        ...synthetic,
        metadata: {
          ...synthetic.metadata,
          fallbackReason: "mercari_error",
          fallbackError: toErrorMessage(error),
        },
      };
    }
  }

  const synthetic = buildSyntheticSnapshotNumbers({
    sku: params.target.sku,
    observedAt: params.observedAt,
    latest: params.latest,
  });

  if (mode === "auto") {
    return {
      ...synthetic,
      metadata: {
        ...synthetic.metadata,
        fallbackReason: "insufficient_mercari_samples",
      },
    };
  }

  return {
    ...synthetic,
    metadata: {
      ...synthetic.metadata,
      fallbackReason: mode === "synthetic" ? "pricing_source_synthetic" : null,
    },
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
  const numbers = await buildSnapshotNumbers({
    target,
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
      ...numbers.metadata,
      soldCount30d: numbers.soldCount30d,
      avgDaysToSell: numbers.avgDaysToSell,
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
