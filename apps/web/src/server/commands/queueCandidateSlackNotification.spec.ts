import { beforeEach, describe, expect, test, vi } from "vitest";
import { queueCandidateSlackNotification } from "./queueCandidateSlackNotification";

const enqueueMock = vi.hoisted(() => vi.fn());

vi.mock("@merchandise/db", () => ({
  repositoryLocator: {
    jobQueue: {
      enqueue: enqueueMock,
    },
  },
  JOB_TYPES: {
    CANDIDATES_NOTIFY_SLACK: "candidates.notifySlack",
  },
}));

vi.mock("@/server/db", () => ({
  getDb: () => ({}),
}));

describe("queueCandidateSlackNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("needs_review のとき job_queue に enqueue する", async () => {
    enqueueMock.mockResolvedValueOnce({
      id: "job-1",
      jobType: "candidates.notifySlack",
    });

    const result = await queueCandidateSlackNotification({
      id: "cand-1",
      listingTitle: "PlayStation 5 CFI-2000 本体",
      listingPriceYen: 49800,
      score: 78,
      reason: "match:title,llm:success,snapshot:available",
      reviewState: "needs_review",
    });

    expect(enqueueMock).toHaveBeenCalledWith(
      expect.anything(),
      {
        jobType: "candidates.notifySlack",
        payload: {
          candidateId: "cand-1",
          listingTitle: "PlayStation 5 CFI-2000 本体",
          listingPriceYen: 49800,
          score: 78,
          reason: "match:title,llm:success,snapshot:available",
        },
      },
    );
    expect(result).toMatchObject({
      id: "job-1",
    });
  });

  test("needs_review 以外は enqueue しない", async () => {
    const result = await queueCandidateSlackNotification({
      id: "cand-2",
      listingTitle: "PlayStation 5 CFI-2000 本体",
      listingPriceYen: 54000,
      score: 12,
      reason: "excluded by score",
      reviewState: "excluded",
    });

    expect(result).toBeNull();
    expect(enqueueMock).not.toHaveBeenCalled();
  });
});
