import { createDb } from "@merchandise/db";
import { config } from "./config";
import { acquireLock, releaseLock } from "./lock";
import { logger } from "./logger";
import { pollAndExecute } from "./poller";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const main = async () => {
  if (!acquireLock()) {
    console.log("another runner is already running. exiting.");
    return;
  }

  process.on("SIGINT", () => { releaseLock(); process.exit(0); });
  process.on("SIGTERM", () => { releaseLock(); process.exit(0); });

  const db = createDb(config.databaseUrl);
  logger.info(`polling started. pid=${process.pid} interval=${config.pollIntervalMs}ms`);

  while (true) {
    try {
      const processed = await pollAndExecute(db);
      if (!processed) {
        await sleep(config.pollIntervalMs);
      }
    } catch (error) {
      logger.error("poll error", error instanceof Error ? error.message : error);
      await sleep(config.errorBackoffMs);
    }
  }
};

main().catch((error) => {
  logger.error("fatal error", error instanceof Error ? error.message : error);
  releaseLock();
  process.exit(1);
});
