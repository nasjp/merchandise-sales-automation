import { clampNonNegative, roundToYen } from "../money";

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);

export const computeSellEstimate = (recentSoldPriceYen: number[]): number => {
  const filtered = recentSoldPriceYen.filter((value) => Number.isFinite(value) && value > 0);
  if (filtered.length === 0) {
    return 0;
  }

  const values = sorted(filtered);
  const drop = Math.floor(values.length * 0.1);
  const trimmed = values.slice(drop, values.length - drop);
  const target = trimmed.length > 0 ? trimmed : values;

  const center = target[Math.floor(target.length / 2)] ?? 0;
  return clampNonNegative(roundToYen(center));
};
