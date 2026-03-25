import { createDb, repositoryLocator } from "@merchandise/db";

const readStdin = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const raw = await readStdin();
  const input = JSON.parse(raw) as {
    targetId: string;
    sellEstimateYen: number;
    buyLimitYen: number;
    liquidityScore: number;
    metadata?: Record<string, unknown>;
  };

  if (!input.targetId || typeof input.sellEstimateYen !== "number") {
    throw new Error("invalid input: targetId and sellEstimateYen are required");
  }

  const db = createDb(databaseUrl);
  const snapshot = await repositoryLocator.snapshots.insert(db, {
    targetId: input.targetId,
    observedAt: new Date(),
    sellEstimateYen: Math.round(input.sellEstimateYen),
    buyLimitYen: Math.round(input.buyLimitYen),
    liquidityScore: Math.round(input.liquidityScore),
    metadata: input.metadata ?? {},
  });

  console.log(JSON.stringify({
    snapshotId: snapshot.id,
    targetId: snapshot.targetId,
    sellEstimateYen: snapshot.sellEstimateYen,
    buyLimitYen: snapshot.buyLimitYen,
    liquidityScore: snapshot.liquidityScore,
  }));
};

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
});
