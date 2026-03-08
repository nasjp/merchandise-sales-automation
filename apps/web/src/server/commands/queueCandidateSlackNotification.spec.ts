import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  CANDIDATE_NOTIFY_SLACK_TASK_NAME,
  queueCandidateSlackNotification,
} from "./queueCandidateSlackNotification";

const queueTaskRunAndDispatchMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/trigger/client", () => ({
  queueTaskRunAndDispatch: queueTaskRunAndDispatchMock,
}));

describe("queueCandidateSlackNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("needs_review のとき通知 task をキューして dispatch する", async () => {
    queueTaskRunAndDispatchMock.mockResolvedValueOnce({
      runId: "run-notify-1",
    });

    const result = await queueCandidateSlackNotification({
      id: "cand-1",
      listingTitle: "PlayStation 5 CFI-2000 本体",
      listingPriceYen: 49800,
      score: 78,
      reason: "match:title,llm:success,snapshot:available",
      reviewState: "needs_review",
    });

    expect(queueTaskRunAndDispatchMock).toHaveBeenCalledWith({
      taskName: CANDIDATE_NOTIFY_SLACK_TASK_NAME,
      payload: {
        candidateId: "cand-1",
        listingTitle: "PlayStation 5 CFI-2000 本体",
        listingPriceYen: 49800,
        score: 78,
        reason: "match:title,llm:success,snapshot:available",
      },
    });
    expect(result).toMatchObject({
      runId: "run-notify-1",
    });
  });

  test("needs_review 以外は通知 task をキューしない", async () => {
    const result = await queueCandidateSlackNotification({
      id: "cand-2",
      listingTitle: "PlayStation 5 CFI-2000 本体",
      listingPriceYen: 54000,
      score: 12,
      reason: "excluded by score",
      reviewState: "excluded",
    });

    expect(result).toBeNull();
    expect(queueTaskRunAndDispatchMock).not.toHaveBeenCalled();
  });
});
