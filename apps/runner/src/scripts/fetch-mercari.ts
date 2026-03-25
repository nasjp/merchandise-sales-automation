import { createDb, repositoryLocator } from "@merchandise/db";
import { createMercariApiClient, type MercariSearchItem } from "@merchandise/mercari";

const main = async () => {
  const targetId = process.argv[2];
  if (!targetId) {
    console.error("usage: npx tsx fetch-mercari.ts <targetId>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const db = createDb(databaseUrl);
  const target = await repositoryLocator.targets.findById(db, targetId);
  if (!target) throw new Error(`target not found: ${targetId}`);

  const keywordA = (target as Record<string, unknown>).searchKeywordA as string | null;
  const keywordB = (target as Record<string, unknown>).searchKeywordB as string | null;
  if (!keywordA) throw new Error(`search_keyword_a is not set for: ${targetId}`);

  const client = createMercariApiClient();

  // キーワードAで検索
  const resultA = await client.searchSoldItems({
    keyword: keywordA,
    pageSize: 120,
    maxPages: 2,
  });

  const itemsById = new Map<string, MercariSearchItem>(resultA.items.map((item) => [item.id, item]));

  // 8件未満かつキーワードBがあれば追加検索
  if (itemsById.size < 8 && keywordB) {
    const resultB = await client.searchSoldItems({
      keyword: keywordB,
      pageSize: 120,
      maxPages: 2,
    });
    for (const item of resultB.items) {
      if (!itemsById.has(item.id)) {
        itemsById.set(item.id, item);
      }
    }
  }

  // SOLD_OUT + MERCARI のみ
  const items = Array.from(itemsById.values())
    .filter((item) => item.status === "ITEM_STATUS_SOLD_OUT")
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      created: item.created ?? null,
      updated: item.updated ?? null,
    }));

  console.log(JSON.stringify({
    targetId,
    sku: target.sku,
    titleKeyword: target.titleKeyword,
    modelKeyword: target.modelKeyword,
    keywordA,
    keywordB,
    fetchedCount: items.length,
    items,
  }));
};

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
