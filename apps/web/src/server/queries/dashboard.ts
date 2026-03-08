import { repositoryLocator } from "@merchandise/db";
import { getDb } from "@/server/db";

export const listRecentRawEvents = async (limit = 20) => {
  const db = getDb();
  return await repositoryLocator.rawEvents.findRecent(db, limit);
};

export const listRecentCandidates = async (limit = 20) => {
  const db = getDb();
  return await repositoryLocator.candidates.findRecent(db, limit);
};

export const listActiveTargets = async () => {
  const db = getDb();
  const targets = await repositoryLocator.targets.findActive(db);

  return await Promise.all(
    targets.map(async (target) => ({
      ...target,
      latestSnapshot: await repositoryLocator.snapshots.findLatestByTargetId(db, target.id),
    })),
  );
};

export const listRecentSnapshots = async (limit = 20) => {
  const db = getDb();
  return await repositoryLocator.snapshots.findRecent(db, limit);
};

export const listRecentTaskRuns = async (limit = 50) => {
  const db = getDb();
  return await repositoryLocator.taskAudit.findRecent(db, limit);
};
