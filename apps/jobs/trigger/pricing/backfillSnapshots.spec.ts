import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { targets } from "@merchandise/db/schema";
import { describe, expect, test, vi } from "vitest";
import { backfillSnapshots } from "./backfillSnapshots";

let currentDb: TestDb | null = null;

vi.mock("../../src/factories/db", () => ({
  getJobsDb: () => {
    if (!currentDb) {
      throw new Error("test db is not initialized");
    }
    return currentDb;
  },
}));

const setupTestContext = async () => {
  const testDb = await createTestDb({
    migrations: true,
    cache: true,
  });
  currentDb = testDb;

  await testDb.insert(targets).values({
    id: "target-1",
    sku: "PS5-CFI-2000",
    titleKeyword: "PlayStation 5",
    modelKeyword: "CFI-2000",
    isActive: true,
  });

  return Object.assign(
    {
      testDb,
    },
    {
      async [Symbol.asyncDispose]() {
        currentDb = null;
        await testDb[Symbol.asyncDispose]();
      },
    },
  );
};

describe("backfillSnapshots", () => {
  test("正常系: 指定日数分の snapshot を作成する", async () => {
    await using ctx = await setupTestContext();

    const result = await backfillSnapshots({
      days: 2,
    });

    expect(result).toMatchObject({
      runId: expect.any(String),
      days: 2,
      status: "success",
      createdCount: 2,
    });
    expect(result.snapshotIds).toHaveLength(2);

    const rows = await repositoryLocator.snapshots.findRecent(ctx.testDb, 10);
    expect(rows).toHaveLength(2);
  });
});
