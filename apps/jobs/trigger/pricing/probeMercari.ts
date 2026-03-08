import { repositoryLocator } from "@merchandise/db";
import { createMercariApiClient } from "@merchandise/mercari";
import { getJobsDb } from "../../src/factories/db";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";

const clampInt = (value: number | undefined, params: { min: number; max: number; fallback: number }) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return params.fallback;
  }

  return Math.max(params.min, Math.min(params.max, Math.floor(value)));
};

const countBy = <T extends string>(values: T[]) => {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
};

const toPriceStats = (prices: number[]) => {
  const sorted = [...prices].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      median: null,
    };
  }

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)] ?? null,
  };
};

export const probeMercariSoldData = async (input: {
  keyword: string;
  pageSize?: number;
  maxPages?: number;
}) => {
  const runId = await createQueuedRun({
    taskName: "pricing.probeMercari",
    payload: input,
  });
  const db = getJobsDb();

  try {
    const keyword = input.keyword.trim();
    if (!keyword) {
      throw new Error("keyword is required");
    }

    const pageSize = clampInt(input.pageSize, {
      min: 10,
      max: 120,
      fallback: 60,
    });
    const maxPages = clampInt(input.maxPages, {
      min: 1,
      max: 5,
      fallback: 2,
    });

    const startedAt = Date.now();
    const client = createMercariApiClient();
    const result = await client.searchSoldItems({
      keyword,
      pageSize,
      maxPages,
    });
    const elapsedMs = Date.now() - startedAt;

    const prices = result.items
      .map((item) => Number.parseInt(item.price, 10))
      .filter((value) => Number.isFinite(value) && value > 0);
    const statuses = countBy(result.items.map((item) => item.status));
    const itemTypes = countBy(result.items.map((item) => item.itemType ?? "UNKNOWN"));

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    return {
      runId,
      status: "success" as const,
      keyword,
      pageSize,
      maxPages,
      elapsedMs,
      pageCount: result.pageCount,
      nextPageToken: result.nextPageToken,
      fetchedCount: result.items.length,
      statusCounts: statuses,
      itemTypeCounts: itemTypes,
      priceStats: toPriceStats(prices),
      sample: result.items.slice(0, 10).map((item) => ({
        id: item.id,
        status: item.status,
        itemType: item.itemType ?? null,
        price: item.price,
        name: item.name,
      })),
    };
  } catch (error) {
    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "failed",
    });
    throw error;
  }
};
