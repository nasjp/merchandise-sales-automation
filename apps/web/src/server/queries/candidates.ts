import { repositoryLocator } from "@merchandise/db";
import { resolveMercariLink } from "@/lib/mercari";
import { getDb } from "@/server/db";

export const listRecentCandidatesWithContext = async (limit = 50) => {
  const db = getDb();
  const rows = await repositoryLocator.candidates.findRecent(db, limit);

  const rowsWithContext = await Promise.all(
    rows.map(async (row) => {
      const rawEvent = await repositoryLocator.rawEvents.findById(db, row.rawEventId);
      if (!rawEvent) {
        return null;
      }

      return {
        id: row.id,
        rawEventId: row.rawEventId,
        listingTitle: row.listingTitle,
        listingPriceYen: row.listingPriceYen,
        reviewState: row.reviewState,
        updatedAt: row.updatedAt,
        reason: row.reason,
        mercariLink: resolveMercariLink({
          title: rawEvent.title,
          body: rawEvent.body,
        }),
      };
    }),
  );

  return rowsWithContext.filter((row) => row !== null);
};

export const findCandidateDetail = async (candidateId: string) => {
  const db = getDb();
  const candidate = await repositoryLocator.candidates.findById(db, candidateId);
  if (!candidate) {
    return null;
  }

  const rawEvent = await repositoryLocator.rawEvents.findById(db, candidate.rawEventId);
  if (!rawEvent) {
    return null;
  }

  const target = candidate.targetId
    ? await repositoryLocator.targets.findById(db, candidate.targetId)
    : null;
  const latestSnapshot = candidate.targetId
    ? await repositoryLocator.snapshots.findLatestByTargetId(db, candidate.targetId)
    : null;

  return {
    ...candidate,
    rawTitle: rawEvent.title,
    rawBody: rawEvent.body,
    rawReceivedAt: rawEvent.receivedAt,
    targetSku: target?.sku ?? null,
    targetTitleKeyword: target?.titleKeyword ?? null,
    targetModelKeyword: target?.modelKeyword ?? null,
    latestSnapshot,
    mercariLink: resolveMercariLink({
      title: rawEvent.title,
      body: rawEvent.body,
    }),
  };
};
