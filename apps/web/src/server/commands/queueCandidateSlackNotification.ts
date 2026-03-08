import type { Candidate } from "@merchandise/db";
import { queueTaskRunAndDispatch } from "@/server/trigger/client";

export const CANDIDATE_NOTIFY_SLACK_TASK_NAME = "candidates.notifySlack";

export const queueCandidateSlackNotification = async (
  candidate: Pick<
    Candidate,
    "id" | "listingTitle" | "listingPriceYen" | "score" | "reason" | "reviewState"
  >,
) => {
  if (candidate.reviewState !== "needs_review") {
    return null;
  }

  return await queueTaskRunAndDispatch({
    taskName: CANDIDATE_NOTIFY_SLACK_TASK_NAME,
    payload: {
      candidateId: candidate.id,
      listingTitle: candidate.listingTitle,
      listingPriceYen: candidate.listingPriceYen,
      score: candidate.score,
      reason: candidate.reason ?? null,
    },
  });
};
