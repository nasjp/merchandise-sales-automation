import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { describe, expect, test, vi } from "vitest";
import { queueTaskRunAndDispatch } from "./client";

let currentDb: TestDb | null = null;
const dispatchTaskRunMock = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/server/db", () => ({
  getDb: () => {
    if (!currentDb) {
      throw new Error("test db is not initialized");
    }
    return currentDb;
  },
}));

vi.mock("./dispatcher", () => ({
  dispatchTaskRun: dispatchTaskRunMock,
}));

const setupTestContext = async () => {
  const testDb = await createTestDb({
    migrations: true,
    cache: true,
  });
  currentDb = testDb;

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

describe("queueTaskRunAndDispatch", () => {
  test("正常系: dispatch 成功時は queued のまま返る", async () => {
    await using ctx = await setupTestContext();
    dispatchTaskRunMock.mockResolvedValueOnce(true);

    const queued = await queueTaskRunAndDispatch({
      taskName: "pricing.recomputeSnapshot",
      runId: "run_dispatch_ok",
      payload: {
        targetId: "target-1",
      },
    });

    expect(queued.runId).toBe("run_dispatch_ok");
    const row = await repositoryLocator.taskAudit.findByRunId(
      ctx.testDb,
      "run_dispatch_ok",
    );
    expect(row?.status).toBe("queued");
  });

  test("異常系: dispatch 失敗時は failed に遷移する", async () => {
    await using ctx = await setupTestContext();
    dispatchTaskRunMock.mockRejectedValueOnce(new Error("dispatch failed"));

    await expect(
      queueTaskRunAndDispatch({
        taskName: "pricing.recomputeSnapshot",
        runId: "run_dispatch_failed",
        payload: {
          targetId: "target-1",
        },
      }),
    ).rejects.toThrow("dispatch failed");

    const row = await repositoryLocator.taskAudit.findByRunId(
      ctx.testDb,
      "run_dispatch_failed",
    );
    expect(row?.status).toBe("failed");
    expect(row?.finishedAt).toBeInstanceOf(Date);
  });
});
