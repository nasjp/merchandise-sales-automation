import { repositoryLocator } from "@merchandise/db";
import { db as createTestDb } from "@merchandise/db/test";
import { priceSnapshots, targets } from "@merchandise/db/schema";
import { describe, expect, test } from "vitest";
import { findDueTargetIds, recomputeSnapshotForTarget } from "./pricing";

const setupTestContext = async () => {
  const testDb = await createTestDb({
    migrations: true,
    cache: true,
  });

  await testDb.insert(targets).values([
    {
      id: "target-due",
      sku: "PS5-CFI-2000",
      titleKeyword: "PlayStation 5",
      modelKeyword: "CFI-2000",
      isActive: true,
    },
    {
      id: "target-fresh",
      sku: "SWITCH-HAC",
      titleKeyword: "Nintendo Switch",
      modelKeyword: "HAC",
      isActive: true,
    },
  ]);

  return Object.assign(
    {
      testDb,
    },
    {
      async [Symbol.asyncDispose]() {
        await testDb[Symbol.asyncDispose]();
      },
    },
  );
};

describe("pricing service", () => {
  test("recomputeSnapshotForTarget: snapshot を作成できる", async () => {
    await using ctx = await setupTestContext();

    const snapshot = await recomputeSnapshotForTarget({
      db: ctx.testDb,
      targetId: "target-due",
      observedAt: new Date("2026-03-08T00:00:00.000Z"),
    });

    expect(snapshot).toMatchObject({
      id: expect.any(String),
      targetId: "target-due",
      sellEstimateYen: expect.any(Number),
      buyLimitYen: expect.any(Number),
      liquidityScore: expect.any(Number),
    });

    const latest = await repositoryLocator.snapshots.findLatestByTargetId(
      ctx.testDb,
      "target-due",
    );
    expect(latest).toMatchObject({
      id: snapshot.id,
      targetId: "target-due",
    });
  });

  test("findDueTargetIds: 24h以上古い target と未作成 target を due と判定する", async () => {
    await using ctx = await setupTestContext();

    await ctx.testDb.insert(priceSnapshots).values({
      id: "snapshot-fresh",
      targetId: "target-fresh",
      observedAt: new Date("2026-03-08T00:00:00.000Z"),
      sellEstimateYen: 50000,
      buyLimitYen: 40000,
      liquidityScore: 70,
      metadata: {},
    });

    const due = await findDueTargetIds({
      db: ctx.testDb,
      now: new Date("2026-03-08T12:00:00.000Z"),
    });

    expect(due.sort()).toEqual(["target-due"]);
  });
});
