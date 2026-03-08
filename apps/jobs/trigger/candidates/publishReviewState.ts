import { repositoryLocator } from "@merchandise/db";
import { getJobsDb } from "../../src/factories/db";

export const publishReviewState = async (input: {
  candidateId: string;
  reviewState: "approved" | "rejected";
  reason?: string;
}) => {
  const db = getJobsDb();

  if (input.reviewState === "approved") {
    return await repositoryLocator.candidates.approve(db, {
      id: input.candidateId,
      reason: input.reason,
    });
  }

  return await repositoryLocator.candidates.reject(db, {
    id: input.candidateId,
    reason: input.reason ?? "rejected by job",
  });
};
