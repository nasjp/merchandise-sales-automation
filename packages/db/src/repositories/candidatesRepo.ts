import { desc, eq } from "drizzle-orm";
import { candidates, type Candidate, type NewCandidate } from "../schema";
import type { DB } from "../types";

export const candidateReviewStates = [
  "pending",
  "needs_review",
  "approved",
  "rejected",
  "excluded",
] as const;

export type CandidateReviewState = (typeof candidateReviewStates)[number];

const isCandidateReviewState = (value: string): value is CandidateReviewState =>
  candidateReviewStates.includes(value as CandidateReviewState);

export type InsertCandidateInput = Pick<
  NewCandidate,
  | "rawEventId"
  | "targetId"
  | "listingTitle"
  | "listingPriceYen"
  | "matchedModel"
  | "score"
  | "reviewState"
  | "reason"
>;

const insert = async (db: DB, input: InsertCandidateInput): Promise<Candidate> => {
  const [row] = await db
    .insert(candidates)
    .values({
      rawEventId: input.rawEventId,
      targetId: input.targetId ?? null,
      listingTitle: input.listingTitle,
      listingPriceYen: input.listingPriceYen,
      matchedModel: input.matchedModel ?? null,
      score: input.score ?? 0,
      reviewState: input.reviewState ?? "pending",
      reason: input.reason ?? null,
    })
    .returning();

  return row;
};

const findById = async (db: DB, id: string): Promise<Candidate | null> => {
  const [row] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);

  return row ?? null;
};

const findByRawEventId = async (
  db: DB,
  rawEventId: string,
): Promise<Candidate | null> => {
  const [row] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.rawEventId, rawEventId))
    .limit(1);

  return row ?? null;
};

const updateReviewState = async (
  db: DB,
  input: {
    id: string;
    reviewState: CandidateReviewState;
    reason?: string | null;
  },
): Promise<Candidate | null> => {
  if (!isCandidateReviewState(input.reviewState)) {
    throw new Error(`invalid review state: ${input.reviewState}`);
  }

  const [row] = await db
    .update(candidates)
    .set({
      reviewState: input.reviewState,
      reason: input.reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(candidates.id, input.id))
    .returning();

  return row ?? null;
};

const approve = async (
  db: DB,
  input: {
    id: string;
    reason?: string | null;
  },
): Promise<Candidate | null> => {
  return await updateReviewState(db, {
    id: input.id,
    reviewState: "approved",
    reason: input.reason ?? null,
  });
};

const reject = async (
  db: DB,
  input: {
    id: string;
    reason: string;
  },
): Promise<Candidate | null> => {
  return await updateReviewState(db, {
    id: input.id,
    reviewState: "rejected",
    reason: input.reason,
  });
};

const findRecent = async (db: DB, limit = 50): Promise<Candidate[]> => {
  return await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.updatedAt), desc(candidates.createdAt))
    .limit(limit);
};

export const candidatesRepo = {
  insert,
  findById,
  findByRawEventId,
  updateReviewState,
  approve,
  reject,
  findRecent,
};
