import { createHmac } from "node:crypto";
import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb, type TestDb } from "@merchandise/db/test";
import { aiRuns, priceSnapshots, targets } from "@merchandise/db/schema";
import { afterEach, describe, expect, test, vi } from "vitest";
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

const createSignedRequest = (params: {
  payload: Record<string, unknown>;
  secret: string;
  timestamp: string;
}) => {
  const rawBody = JSON.stringify(params.payload);
  const signature = createHmac("sha256", params.secret)
    .update(`${params.timestamp}.${rawBody}`)
    .digest("hex");

  return new Request("http://localhost/api/ingest/android", {
    method: "POST",
    body: rawBody,
    headers: {
      "content-type": "application/json",
      "x-ingest-timestamp": params.timestamp,
      "x-ingest-signature": signature,
    },
  });
};

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

  await testDb.insert(priceSnapshots).values({
    id: "snapshot-1",
    targetId: "target-1",
    observedAt: new Date("2026-03-08T00:00:00.000Z"),
    sellEstimateYen: 68000,
    buyLimitYen: 52000,
    liquidityScore: 72,
    metadata: {},
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

afterEach(() => {
  delete process.env.ANDROID_INGEST_SHARED_SECRET;
});

describe("POST /api/ingest/android", () => {
  test("正常系: 新規受信で raw_event と candidate が作成される", async () => {
    await using ctx = await setupTestContext();
    process.env.ANDROID_INGEST_SHARED_SECRET = "test-secret";

    const payload = {
      notificationId: "notif-1",
      title: "PlayStation 5 CFI-2000 本体 49,800円",
      body: "即購入可 49800円",
      receivedAt: "2026-03-08T01:00:00+09:00",
      sourcePackage: "com.mercari",
    };

    const request = createSignedRequest({
      payload,
      secret: "test-secret",
      timestamp: Date.now().toString(),
    });
    const response = await POST(request);
    const body = (await response.json()) as {
      eventId: string;
      deduped: boolean;
      queued: boolean;
    };

    expect(response.status).toBe(202);
    expect(body).toMatchObject({
      eventId: expect.any(String),
      deduped: false,
      queued: true,
    });

    const rawEvent = await repositoryLocator.rawEvents.findById(ctx.testDb, body.eventId);
    expect(rawEvent).toMatchObject({
      id: body.eventId,
      source: "android",
      title: payload.title,
    });
    expect(rawEvent?.processedAt).toBeInstanceOf(Date);

    const candidate = await repositoryLocator.candidates.findByRawEventId(
      ctx.testDb,
      body.eventId,
    );
    expect(candidate).toMatchObject({
      rawEventId: body.eventId,
      targetId: "target-1",
      reviewState: expect.any(String),
      score: expect.any(Number),
    });

    const aiRunRows = await ctx.testDb.select().from(aiRuns);
    expect(aiRunRows).toHaveLength(1);
    expect(aiRunRows[0]).toMatchObject({
      taskName: "ai.extractListingAttributes",
      provider: "deterministic",
      status: "success",
    });
  });

  test("正常系: 重複受信は dedupe される", async () => {
    await using ctx = await setupTestContext();
    process.env.ANDROID_INGEST_SHARED_SECRET = "test-secret";

    const payload = {
      notificationId: "notif-2",
      title: "PlayStation 5 CFI-2000 51,000円",
      body: "状態良好",
      receivedAt: "2026-03-08T02:00:00+09:00",
      sourcePackage: "com.mercari",
    };
    const timestamp = Date.now().toString();

    const first = await POST(
      createSignedRequest({
        payload,
        secret: "test-secret",
        timestamp,
      }),
    );
    const firstBody = (await first.json()) as { eventId: string };

    const second = await POST(
      createSignedRequest({
        payload,
        secret: "test-secret",
        timestamp,
      }),
    );
    const secondBody = (await second.json()) as {
      eventId: string;
      deduped: boolean;
      queued: boolean;
    };

    expect(second.status).toBe(200);
    expect(secondBody).toMatchObject({
      eventId: firstBody.eventId,
      deduped: true,
      queued: false,
    });

    const candidate = await repositoryLocator.candidates.findByRawEventId(
      ctx.testDb,
      firstBody.eventId,
    );
    expect(candidate).toMatchObject({
      rawEventId: firstBody.eventId,
    });

    const aiRunRows = await ctx.testDb.select().from(aiRuns);
    expect(aiRunRows).toHaveLength(1);
  });
});
