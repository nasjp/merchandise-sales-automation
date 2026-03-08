import { clampNonNegative, roundToYen } from "../money";

export const computeLiquidityScore = (params: {
  soldCount30d: number;
  avgDaysToSell: number;
}): number => {
  const soldScore = Math.min(60, clampNonNegative(params.soldCount30d) * 3);
  const speedPenalty = Math.min(40, clampNonNegative(params.avgDaysToSell) * 2);
  return Math.max(0, Math.min(100, roundToYen(soldScore + (40 - speedPenalty))));
};
