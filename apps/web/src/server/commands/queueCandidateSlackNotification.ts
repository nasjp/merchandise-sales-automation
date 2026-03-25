import { type Candidate, repositoryLocator, JOB_TYPES } from "@merchandise/db";
import { getDb } from "@/server/db";

export const queueCandidateSlackNotification = async (
  candidate: Pick<
    Candidate,
    "id" | "listingTitle" | "listingPriceYen" | "score" | "reason" | "reviewState"
  >,
) => {
  if (candidate.reviewState !== "needs_review") {
    return null;
  }

  const db = getDb();
  return await repositoryLocator.jobQueue.enqueue(db, {
    jobType: JOB_TYPES.CANDIDATES_NOTIFY_SLACK,
    payload: {
      candidateId: candidate.id,
      listingTitle: candidate.listingTitle,
      listingPriceYen: candidate.listingPriceYen,
      score: candidate.score,
      reason: candidate.reason ?? null,
    },
  });
};
