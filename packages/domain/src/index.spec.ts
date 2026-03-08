import { describe, expect, test } from "vitest";
import {
  computeBuyLimit,
  computeLiquidityScore,
  computeSellEstimate,
  decideReviewState,
  matchTarget,
  normalizeModel,
  normalizeTitle,
  scoreCandidate,
} from ".";

describe("domain functions", () => {
  test.each([
    {
      name: "computeSellEstimate returns median-like value",
      input: [22000, 21000, 23000, 100000],
      want: 23000,
    },
    {
      name: "computeSellEstimate returns 0 when no valid prices",
      input: [0, -1, Number.NaN],
      want: 0,
    },
  ])("$name", ({ input, want }) => {
    expect(computeSellEstimate(input)).toBe(want);
  });

  test("computeBuyLimit calculates non-negative limit", () => {
    const got = computeBuyLimit({
      sellEstimateYen: 30000,
      targetMarginRate: 0.15,
      platformFeeRate: 0.1,
      shippingCostYen: 750,
    });

    expect(got).toBe(21750);
  });

  test("computeLiquidityScore ranges 0-100", () => {
    const got = computeLiquidityScore({
      soldCount30d: 15,
      avgDaysToSell: 3,
    });
    expect(got).toBeGreaterThanOrEqual(0);
    expect(got).toBeLessThanOrEqual(100);
  });

  test("normalize helpers normalize symbols and cases", () => {
    expect(normalizeTitle("【PS5】 PlayStation 5 ")).toBe("ps5playstation5");
    expect(normalizeModel("cfi-2000 a01")).toBe("CFI2000A01");
  });

  test.each([
    {
      name: "matchTarget matched",
      input: {
        title: "PlayStation 5 CFI-2000A01 本体",
        target: {
          id: "target-1",
          titleKeyword: "PlayStation 5",
          modelKeyword: "CFI-2000A01",
          isActive: true,
        },
      },
      wantMatched: true,
    },
    {
      name: "matchTarget title mismatch",
      input: {
        title: "Nintendo Switch 本体",
        target: {
          id: "target-1",
          titleKeyword: "PlayStation 5",
          modelKeyword: "CFI-2000A01",
          isActive: true,
        },
      },
      wantMatched: false,
    },
  ])("$name", ({ input, wantMatched }) => {
    const got = matchTarget(input);
    expect(got.matched).toBe(wantMatched);
  });

  test("candidate scoring and state decision", () => {
    const score = scoreCandidate({
      listingPriceYen: 18000,
      buyLimitYen: 23000,
      liquidityScore: 70,
    });
    expect(score).toBeGreaterThan(0);

    const state = decideReviewState({
      score,
      expectedProfitYen: 4000,
    });
    expect(["needs_review", "excluded"]).toContain(state);
  });
});
