import { describe, expect, test } from "vitest";
import { db as createTestDb } from "../test";
import { repositoryLocator } from "./locator";

const setupTestContext = async () => {
  const testDb = await createTestDb({ migrations: true, cache: true });

  const ctx = {
    testDb,
    repositoryLocator,
  };

  return Object.assign(ctx, {
    async [Symbol.asyncDispose]() {
      await testDb[Symbol.asyncDispose]();
    },
  });
};

describe("repositoryLocator.rawEvents.insertOrGetByDedupe", () => {
  describe("正常系", () => {
    const cases = [
      {
        name: "同じdedupeKeyが未登録なら新規作成される",
        input: {
          source: "android",
          notificationId: "noti-1",
          title: "PlayStation 5 本体",
          body: "30000円で出品されました",
          dedupeKey: "dedupe-1",
          receivedAt: new Date("2026-03-08T00:00:00.000Z"),
        },
        wantDeduped: false,
      },
      {
        name: "同じdedupeKeyが既存なら既存行が返る",
        input: {
          source: "android",
          notificationId: "noti-2",
          title: "PlayStation 5 本体",
          body: "30000円で出品されました",
          dedupeKey: "dedupe-shared",
          receivedAt: new Date("2026-03-08T00:00:00.000Z"),
        },
        wantDeduped: true,
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();

      if (tc.wantDeduped) {
        await ctx.repositoryLocator.rawEvents.insertOrGetByDedupe(ctx.testDb, {
          ...tc.input,
          notificationId: "seed-noti",
        });
      }

      const got = await ctx.repositoryLocator.rawEvents.insertOrGetByDedupe(
        ctx.testDb,
        tc.input,
      );

      expect(got.deduped).toBe(tc.wantDeduped);
      expect(got.event).toMatchObject({
        id: expect.any(String),
        source: "android",
        title: "PlayStation 5 本体",
        body: "30000円で出品されました",
        dedupeKey: tc.input.dedupeKey,
      });
      expect(got.event.receivedAt).toBeInstanceOf(Date);
      expect(got.event.createdAt).toBeInstanceOf(Date);
    });
  });
});
