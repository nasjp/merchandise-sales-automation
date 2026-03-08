export const roundToYen = (value: number): number => Math.round(value);

export const clampNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export const computeProfitYen = (params: {
  sellPriceYen: number;
  buyPriceYen: number;
  feeYen?: number;
  shippingYen?: number;
}): number => {
  const fee = params.feeYen ?? 0;
  const shipping = params.shippingYen ?? 0;
  return roundToYen(params.sellPriceYen - params.buyPriceYen - fee - shipping);
};
