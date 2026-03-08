import { describe, expect, test, vi } from "vitest";
import { processRawEvent } from "./processRawEvent";

const createQueuedRunMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/task-helpers/taskAudit", () => ({
  createQueuedRun: createQueuedRunMock,
}));

describe("processRawEvent", () => {
  test("正常系: runId を発行して queued を返す", async () => {
    createQueuedRunMock.mockResolvedValueOnce("job-raw-1");

    const result = await processRawEvent({
      rawEventId: "raw-1",
    });

    expect(createQueuedRunMock).toHaveBeenCalledWith({
      taskName: "ingest.processRawEvent",
      payload: {
        rawEventId: "raw-1",
      },
    });
    expect(result).toMatchObject({
      runId: "job-raw-1",
      rawEventId: "raw-1",
      status: "queued",
    });
  });
});
