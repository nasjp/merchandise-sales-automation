import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { rawEvents, targets } from "@merchandise/db/schema";
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

  await testDb.insert(targets).values({
    id: "target-1",
    sku: "PS5-CFI-2000",
    titleKeyword: "PlayStation 5",
    modelKeyword: "CFI-2000",
    isActive: true,
  });

  await testDb.insert(rawEvents).values({
    id: "raw-1",
    source: "android",
    notificationId: "notif-1",
    title: "PlayStation 5 CFI-2000",
    body: "body",
    dedupeKey: "dedupe-1",
    receivedAt: new Date("2026-03-08T00:00:00.000Z"),
  });

  const candidate = await repositoryLocator.candidates.insert(testDb, {
    rawEventId: "raw-1",
    targetId: "target-1",
    listingTitle: "PlayStation 5 CFI-2000",
    listingPriceYen: 49800,
    matchedModel: "CFI-2000",
    score: 65,
    reviewState: "needs_review",
    reason: "seed",
  });

  return Object.assign(
    {
      testDb,
      candidateId: candidate.id,
    },
    {
      async [Symbol.asyncDispose]() {
        currentDb = null;
        await testDb[Symbol.asyncDispose]();
      },
    },
  );
};

describe("POST /api/candidates/[candidateId]/reject", () => {
  test("正常系: candidate が rejected になる", async () => {
    await using ctx = await setupTestContext();

    const request = new Request(
      `http://localhost/api/candidates/${ctx.candidateId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({
          reason: "not profitable",
        }),
        headers: {
          "content-type": "application/json",
        },
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({
        candidateId: ctx.candidateId,
      }),
    });
    const body = (await response.json()) as {
      candidateId: string;
      reviewState: string;
      reason: string | null;
      updatedAt: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      candidateId: ctx.candidateId,
      reviewState: "rejected",
      reason: "not profitable",
      updatedAt: expect.any(String),
    });

    const row = await repositoryLocator.candidates.findById(ctx.testDb, ctx.candidateId);
    expect(row).toMatchObject({
      id: ctx.candidateId,
      reviewState: "rejected",
      reason: "not profitable",
    });
  });
});
