import { clampNonNegative, roundToYen } from "../money";

export const computeBuyLimit = (params: {
  sellEstimateYen: number;
  targetMarginRate: number;
  platformFeeRate: number;
  shippingCostYen: number;
}): number => {
  const targetMargin = params.sellEstimateYen * params.targetMarginRate;
  const platformFee = params.sellEstimateYen * params.platformFeeRate;

  return clampNonNegative(
    roundToYen(params.sellEstimateYen - targetMargin - platformFee - params.shippingCostYen),
  );
};
