import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { targets } from "./schema";
import { db as createTestDb } from "./test";

describe("packages/db test helper", () => {
  it("applies migrations and can write/read", async () => {
    const testDb = await createTestDb();

    try {
      const [created] = await testDb
        .insert(targets)
        .values({
          sku: "TEST-SKU-001",
          titleKeyword: "PlayStation 5",
          modelKeyword: "CFI-2000",
          isActive: true,
        })
        .returning();

      const found = await testDb
        .select()
        .from(targets)
        .where(eq(targets.id, created.id));

      expect(found).toHaveLength(1);
      expect(found[0]?.sku).toBe("TEST-SKU-001");
    } finally {
      await testDb[Symbol.asyncDispose]();
    }
  });

  it("cache mode reuses client and resets table", async () => {
    const first = await createTestDb({ cache: true });
    try {
      await first.insert(targets).values({
        sku: "TEST-SKU-RESET",
        titleKeyword: "Nintendo Switch",
      });
    } finally {
      await first[Symbol.asyncDispose]();
    }

    const second = await createTestDb({ cache: true });
    try {
      const rows = await second.select().from(targets);
      expect(rows).toHaveLength(0);
    } finally {
      await second[Symbol.asyncDispose]();
    }
  });
});
