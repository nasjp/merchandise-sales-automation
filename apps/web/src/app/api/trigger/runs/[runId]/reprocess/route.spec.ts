import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { describe, expect, test, vi } from "vitest";
import { POST } from "./route";

let currentDb: TestDb | null = null;

vi.mock("@/server/db", () => ({
  getDb: () => {
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

  await repositoryLocator.taskAudit.insert(testDb, {
    taskName: "pricing.recomputeSnapshot",
    runId: "run-base-1",
    status: "failed",
    payload: {
      targetId: "target-1",
    },
    startedAt: new Date("2026-03-08T00:00:00.000Z"),
    finishedAt: new Date("2026-03-08T00:01:00.000Z"),
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

describe("POST /api/trigger/runs/[runId]/reprocess", () => {
  test("正常系: runId 起点で再実行をキューできる", async () => {
    await using ctx = await setupTestContext();

    const request = new Request(
      "http://localhost/api/trigger/runs/run-base-1/reprocess",
      {
        method: "POST",
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        runId: "run-base-1",
      }),
    });
    const body = (await response.json()) as {
      runId: string;
      requeuedFromRunId: string;
      taskName: string;
      status: string;
    };

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      runId: expect.any(String),
      requeuedFromRunId: "run-base-1",
      taskName: "pricing.recomputeSnapshot",
      status: "queued",
    });

    const row = await repositoryLocator.taskAudit.findByRunId(ctx.testDb, body.runId);
    expect(row).toMatchObject({
      runId: body.runId,
      status: "queued",
      taskName: "pricing.recomputeSnapshot",
    });
    expect(row?.payload).toMatchObject({
      targetId: "target-1",
      requeuedFromRunId: "run-base-1",
    });
  });
});
