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

const seedCandidate = async (params: {
  ctx: Awaited<ReturnType<typeof setupTestContext>>;
  suffix: string;
}) => {
  const rawEvent = await params.ctx.repositoryLocator.rawEvents.insert(params.ctx.testDb, {
    source: "android",
    notificationId: `noti-${params.suffix}`,
    title: "PlayStation 5 本体",
    body: "30000円で出品されました",
    dedupeKey: `dedupe-${params.suffix}`,
    receivedAt: new Date("2026-03-08T00:00:00.000Z"),
  });

  return await params.ctx.repositoryLocator.candidates.insert(params.ctx.testDb, {
    rawEventId: rawEvent.id,
    listingTitle: `candidate-${params.suffix}`,
    listingPriceYen: 30000,
    reviewState: "pending",
  });
};

describe("repositoryLocator.candidates.approve", () => {
  describe("正常系", () => {
    const cases = [
      {
        name: "理由なしで承認できる",
        reason: undefined,
      },
      {
        name: "理由付きで承認できる",
        reason: "価格差が十分にあるため",
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();
      const candidate = await seedCandidate({
        ctx,
        suffix: tc.name,
      });

      const got = await ctx.repositoryLocator.candidates.approve(ctx.testDb, {
        id: candidate.id,
        reason: tc.reason,
      });

      expect(got).toMatchObject({
        id: candidate.id,
        reviewState: "approved",
        reason: tc.reason ?? null,
      });
      expect(got?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("異常系", () => {
    const cases = [
      {
        name: "存在しないcandidateIdならnullを返す",
        id: "missing-candidate",
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();

      const got = await ctx.repositoryLocator.candidates.approve(ctx.testDb, {
        id: tc.id,
      });

      expect(got).toBeNull();
    });
  });
});

describe("repositoryLocator.candidates.reject", () => {
  describe("正常系", () => {
    const cases = [
      {
        name: "理由付きで却下できる",
        reason: "状態ランクが不明でリスクが高い",
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();
      const candidate = await seedCandidate({
        ctx,
        suffix: "reject",
      });

      const got = await ctx.repositoryLocator.candidates.reject(ctx.testDb, {
        id: candidate.id,
        reason: tc.reason,
      });

      expect(got).toMatchObject({
        id: candidate.id,
        reviewState: "rejected",
        reason: tc.reason,
      });
      expect(got?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("異常系", () => {
    const cases = [
      {
        name: "存在しないcandidateIdならnullを返す",
        id: "missing-candidate",
        reason: "価格条件を満たさない",
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();

      const got = await ctx.repositoryLocator.candidates.reject(ctx.testDb, {
        id: tc.id,
        reason: tc.reason,
      });

      expect(got).toBeNull();
    });
  });
});
