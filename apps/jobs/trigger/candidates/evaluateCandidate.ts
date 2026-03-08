import {
  decideReviewState,
  scoreCandidate,
  type ReviewState,
} from "@merchandise/domain";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";

export const evaluateCandidate = async (input: {
  candidateId: string;
  listingPriceYen: number;
  buyLimitYen: number;
  liquidityScore: number;
  expectedProfitYen: number;
}): Promise<{
  runId: string;
  candidateId: string;
  score: number;
  reviewState: ReviewState;
}> => {
  const runId = await createQueuedRun({
    taskName: "candidates.evaluateCandidate",
    payload: input,
  });

  const score = scoreCandidate({
    listingPriceYen: input.listingPriceYen,
    buyLimitYen: input.buyLimitYen,
    liquidityScore: input.liquidityScore,
  });

  const reviewState = decideReviewState({
    score,
    expectedProfitYen: input.expectedProfitYen,
  });

  return {
    runId,
    candidateId: input.candidateId,
    score,
    reviewState,
  };
};
