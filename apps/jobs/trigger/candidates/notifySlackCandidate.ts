import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";
import {
  sendCandidateNeedsReviewSlackNotification,
  toSlackErrorMessage,
} from "../../src/services/slack";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";

export const notifySlackCandidate = async (input: {
  runId?: string;
  candidateId: string;
  listingTitle: string;
  listingPriceYen: number;
  score: number;
  reason?: string | null;
}) => {
  const runId =
    input.runId ??
    (await createQueuedRun({
      taskName: "candidates.notifySlack",
      payload: {
        candidateId: input.candidateId,
        listingTitle: input.listingTitle,
        listingPriceYen: input.listingPriceYen,
        score: input.score,
        reason: input.reason ?? null,
      },
    }));
  const db = getJobsDb();

  try {
    const sent = await sendCandidateNeedsReviewSlackNotification({
      candidateId: input.candidateId,
      listingTitle: input.listingTitle,
      listingPriceYen: input.listingPriceYen,
      score: input.score,
      reason: input.reason ?? null,
    });

    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "success",
    });

    return {
      runId,
      status: "success" as const,
      candidateId: input.candidateId,
      channelId: sent.channelId,
      detailUrl: sent.detailUrl,
      messageTs: sent.messageTs,
    };
  } catch (error) {
    await repositoryLocator.taskAudit.markFinished(db, {
      runId,
      status: "failed",
    });
    throw new Error(toSlackErrorMessage(error));
  }
};
