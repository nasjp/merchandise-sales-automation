export type ReviewState = "needs_review" | "excluded";

export const decideReviewState = (input: {
  score: number;
  expectedProfitYen: number;
}): ReviewState => {
  if (input.score >= 50 && input.expectedProfitYen >= 3000) {
    return "needs_review";
  }

  return "excluded";
};
