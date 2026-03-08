import { repositoryLocator } from "@merchandise/db";
import { extractMercariItemUrl } from "@/lib/mercari";
import { getDb } from "@/server/db";

export type CandidateListScope = "open" | "all";

export const listRecentCandidatesWithContext = async (input?: {
  limit?: number;
  scope?: CandidateListScope;
}) => {
  const db = getDb();
  const limit = input?.limit ?? 50;
  const scope = input?.scope ?? "open";
  const rows =
    scope === "all"
      ? await repositoryLocator.candidates.findRecent(db, limit)
      : await repositoryLocator.candidates.findRecentOpen(db, limit);

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
        listingUrl: extractMercariItemUrl({
          title: rawEvent.title,
          body: rawEvent.body,
        }),
      };
    }),
  );

  return rowsWithContext.filter((row) => row !== null);
};

export const countOpenCandidates = async () => {
  const db = getDb();
  return await repositoryLocator.candidates.countOpen(db);
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
    listingUrl: extractMercariItemUrl({
      title: rawEvent.title,
      body: rawEvent.body,
    }),
  };
};
