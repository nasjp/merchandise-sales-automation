import { repositoryLocator, type AppDb } from "@merchandise/db";
import { executeWithClaude } from "./executor";
import { logger } from "./logger";

export const pollAndExecute = async (db: AppDb): Promise<boolean> => {
  const job = await repositoryLocator.jobQueue.claimNext(db);
  if (!job) return false;

  logger.info(`claimed job ${job.id} (${job.jobType}) attempt=${job.attempt}`);
  await repositoryLocator.jobQueue.markRunning(db, job.id);

  try {
    const result = await executeWithClaude(job);
    await repositoryLocator.jobQueue.markCompleted(db, job.id, result);
    logger.info(`completed job ${job.id}`, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await repositoryLocator.jobQueue.markFailed(db, job.id, message);
    logger.error(`failed job ${job.id}: ${message}`);
  }

  return true;
};
