import { repositoryLocator } from "@merchandise/db";
import { getDb } from "@/server/db";

export const getDataHealthSummary = async () => {
  const db = getDb();

  const activeTargets = await repositoryLocator.targets.findActive(db);
  const recentSnapshots = await repositoryLocator.snapshots.findRecent(db, 50);
  const recentCandidates = await repositoryLocator.candidates.findRecent(db, 50);
  const recentRawEvents = await repositoryLocator.rawEvents.findRecent(db, 50);

  return {
    activeTargetCount: activeTargets.length,
    recentSnapshotCount: recentSnapshots.length,
    recentCandidateCount: recentCandidates.length,
    recentRawEventCount: recentRawEvents.length,
    latestSnapshotObservedAt: recentSnapshots[0]?.observedAt ?? null,
    latestRawEventReceivedAt: recentRawEvents[0]?.receivedAt ?? null,
  };
};
