import { z } from "zod";

export const candidateReviewStateSchema = z.enum([
  "pending",
  "needs_review",
  "approved",
  "rejected",
  "excluded",
]);

export const candidateApprovePayloadSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export const candidateRejectPayloadSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const candidateReviewResponseSchema = z.object({
  candidateId: z.string(),
  reviewState: candidateReviewStateSchema,
  reason: z.string().nullable(),
  updatedAt: z.string().datetime({ offset: true }),
});

export type CandidateReviewState = z.infer<typeof candidateReviewStateSchema>;
export type CandidateApprovePayload = z.infer<typeof candidateApprovePayloadSchema>;
export type CandidateRejectPayload = z.infer<typeof candidateRejectPayloadSchema>;
export type CandidateReviewResponse = z.infer<typeof candidateReviewResponseSchema>;
