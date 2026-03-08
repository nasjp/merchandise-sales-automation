import { describe, expect, test, vi } from "vitest";
import { evaluateCandidate } from "./evaluateCandidate";

const createQueuedRunMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/task-helpers/taskAudit", () => ({
  createQueuedRun: createQueuedRunMock,
}));

describe("evaluateCandidate", () => {
  test("正常系: score と reviewState を計算して返す", async () => {
    createQueuedRunMock.mockResolvedValueOnce("job-candidate-1");

    const result = await evaluateCandidate({
      candidateId: "cand-1",
      listingPriceYen: 48000,
      buyLimitYen: 55000,
      liquidityScore: 70,
      expectedProfitYen: 6000,
    });

    expect(result).toMatchObject({
      runId: "job-candidate-1",
      candidateId: "cand-1",
      reviewState: "needs_review",
      score: expect.any(Number),
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
