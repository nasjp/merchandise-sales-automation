import { repositoryLocator } from "@merchandise/db";
import { getDb } from "@/server/db";

export const approveCandidate = async (input: {
  candidateId: string;
  reason?: string;
}) => {
  const db = getDb();
  return await repositoryLocator.candidates.approve(db, {
    id: input.candidateId,
    reason: input.reason,
  });
};

export const rejectCandidate = async (input: {
  candidateId: string;
  reason: string;
}) => {
  const db = getDb();
  return await repositoryLocator.candidates.reject(db, {
    id: input.candidateId,
    reason: input.reason,
  });
};
