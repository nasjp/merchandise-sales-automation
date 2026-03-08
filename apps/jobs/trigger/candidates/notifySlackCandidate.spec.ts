import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { describe, expect, test, vi } from "vitest";
import { notifySlackCandidate } from "./notifySlackCandidate";

let currentDb: TestDb | null = null;
const sendCandidateNeedsReviewSlackNotificationMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/factories/db", () => ({
  getJobsDb: () => {
    if (!currentDb) {
      throw new Error("test db is not initialized");
    }
    return currentDb;
  },
}));

vi.mock("../../src/services/slack", () => ({
  sendCandidateNeedsReviewSlackNotification: sendCandidateNeedsReviewSlackNotificationMock,
  toSlackErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : String(error),
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

describe("notifySlackCandidate", () => {
  test("正常系: 通知成功時に task_audit を success で完了する", async () => {
    await using ctx = await setupTestContext();
    await repositoryLocator.taskAudit.insert(ctx.testDb, {
      taskName: "candidates.notifySlack",
      runId: "run-notify-ok",
      status: "queued",
      payload: {},
      startedAt: new Date("2026-03-08T00:00:00.000Z"),
      finishedAt: null,
    });
    sendCandidateNeedsReviewSlackNotificationMock.mockResolvedValueOnce({
      channelId: "C12345",
      detailUrl: "https://merchandise-sales-automation-web.vercel.app/candidates/cand-1",
      messageTs: "1700000000.000100",
      text: "dummy",
    });

    const result = await notifySlackCandidate({
      runId: "run-notify-ok",
      candidateId: "cand-1",
      listingTitle: "PlayStation 5 CFI-2000 本体",
      listingPriceYen: 49800,
      score: 78,
      reason: "match:title,llm:success,snapshot:available",
    });

    expect(result).toMatchObject({
      runId: "run-notify-ok",
      status: "success",
      candidateId: "cand-1",
      channelId: "C12345",
      detailUrl:
        "https://merchandise-sales-automation-web.vercel.app/candidates/cand-1",
    });

    const taskRun = await repositoryLocator.taskAudit.findByRunId(
      ctx.testDb,
      "run-notify-ok",
    );
    expect(taskRun?.status).toBe("success");
    expect(taskRun?.finishedAt).toBeInstanceOf(Date);
  });

  test("異常系: 通知失敗時に task_audit を failed で完了する", async () => {
    await using ctx = await setupTestContext();
    await repositoryLocator.taskAudit.insert(ctx.testDb, {
      taskName: "candidates.notifySlack",
      runId: "run-notify-failed",
      status: "queued",
      payload: {},
      startedAt: new Date("2026-03-08T00:00:00.000Z"),
      finishedAt: null,
    });
    sendCandidateNeedsReviewSlackNotificationMock.mockRejectedValueOnce(
      new Error("slack request failed"),
    );

    await expect(
      notifySlackCandidate({
        runId: "run-notify-failed",
        candidateId: "cand-2",
        listingTitle: "PlayStation 5 CFI-2000 本体",
        listingPriceYen: 49800,
        score: 78,
        reason: null,
      }),
    ).rejects.toThrow("slack request failed");

    const taskRun = await repositoryLocator.taskAudit.findByRunId(
      ctx.testDb,
      "run-notify-failed",
    );
    expect(taskRun?.status).toBe("failed");
    expect(taskRun?.finishedAt).toBeInstanceOf(Date);
  });
});
