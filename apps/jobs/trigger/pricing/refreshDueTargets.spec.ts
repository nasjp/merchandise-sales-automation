import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { targets } from "@merchandise/db/schema";
import { describe, expect, test, vi } from "vitest";
import { refreshDueTargets } from "./refreshDueTargets";

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

describe("refreshDueTargets", () => {
  test("正常系: due target の snapshot を作成する", async () => {
    await using ctx = await setupTestContext();

    const result = await refreshDueTargets();

    expect(result).toMatchObject({
      runId: expect.any(String),
      status: "success",
      dueCount: 1,
      processedTargetIds: ["target-1"],
    });

    const latest = await repositoryLocator.snapshots.findLatestByTargetId(
      ctx.testDb,
      "target-1",
    );
    expect(latest).toMatchObject({
      id: expect.any(String),
      targetId: "target-1",
    });

    const taskRun = await repositoryLocator.taskAudit.findByRunId(
      ctx.testDb,
      result.runId,
    );
    expect(taskRun).toMatchObject({
      runId: result.runId,
      status: "success",
      taskName: "pricing.refreshDueTargets",
    });
  });
});
