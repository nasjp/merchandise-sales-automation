import { createDb, repositoryLocator } from "@merchandise/db";
import { createMercariApiClient, type MercariSearchItem } from "@merchandise/mercari";

const KEYWORD_MAP: Record<string, { a: string; b: string }> = {
  target_apple_watch_se2_44: { a: "apple watch se 第2世代 44mm gps", b: "apple watch se2 44mm gps" },
  target_apple_watch_se2_40: { a: "apple watch se 第2世代 40mm gps", b: "apple watch se2 40mm gps" },
  target_apple_watch_s8_45: { a: "apple watch series 8 45mm gps", b: "apple watch8 45mm gps" },
  target_apple_watch_s8_41: { a: "apple watch series 8 41mm gps", b: "apple watch8 41mm gps" },
  target_wh1000xm5: { a: "sony ヘッドホン wh-1000xm5", b: "wh-1000xm5" },
  target_switch_lite: { a: "nintendo switch lite 本体", b: "switch lite 本体" },
  target_switch_oled: { a: "nintendo switch 有機elモデル 本体", b: "switch 有機el 本体" },
  target_pixel7a_128: { a: "google pixel 7a 128gb 本体", b: "pixel7a 128gb" },
  target_iphone13_128_simfree: { a: "iphone 13 128gb simフリー 本体", b: "iphone13 simフリー 128gb" },
  target_iphone13mini_128_simfree: { a: "iphone 13 mini 128gb simフリー 本体", b: "iphone13mini simフリー 128gb" },
};

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

  const keywords = KEYWORD_MAP[targetId];
  if (!keywords) throw new Error(`no keyword map for: ${targetId}`);

  const client = createMercariApiClient();

  // キーワードAで検索
  const resultA = await client.searchSoldItems({
    keyword: keywords.a,
    pageSize: 120,
    maxPages: 2,
  });

  const itemsById = new Map<string, MercariSearchItem>(resultA.items.map((item) => [item.id, item]));

  // 8件未満ならキーワードBでも検索
  if (itemsById.size < 8) {
    const resultB = await client.searchSoldItems({
      keyword: keywords.b,
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
    keywordA: keywords.a,
    keywordB: keywords.b,
    fetchedCount: items.length,
    items,
  }));
};

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
