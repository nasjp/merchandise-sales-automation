import { clampNonNegative } from "../money";

export type ScoreCandidateInput = {
  listingPriceYen: number;
  buyLimitYen: number;
  liquidityScore: number;
};

export const scoreCandidate = (input: ScoreCandidateInput): number => {
  const discountScore = clampNonNegative((input.buyLimitYen - input.listingPriceYen) / 500);
  const liquidityBonus = clampNonNegative(input.liquidityScore / 10);
  return Math.max(0, Math.min(100, Math.round(discountScore * 8 + liquidityBonus * 2)));
};
