import type { AppDb } from "@merchandise/db";
import { describe, expect, test, vi } from "vitest";
import { createQueuedRun } from "./taskAudit";

describe("createQueuedRun", () => {
  test("正常系: task_audit insert 成功時に runId を返す", async () => {
    const insertTaskAudit = vi.fn().mockResolvedValue({
      id: "ta-1",
    });
    const getDb = () => ({}) as AppDb;

    const runId = await createQueuedRun({
      taskName: "ingest.processRawEvent",
      payload: {
        rawEventId: "raw-1",
      },
      deps: {
        insertTaskAudit,
        getDb,
      },
    });

    expect(runId).toEqual(expect.stringMatching(/^job_/));
    expect(insertTaskAudit).toHaveBeenCalledTimes(1);
    expect(insertTaskAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        taskName: "ingest.processRawEvent",
        runId,
        status: "queued",
      }),
    );
  });

  test("失敗再試行: 一度失敗しても retries 内で成功すれば返せる", async () => {
    const insertTaskAudit = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary error"))
      .mockResolvedValueOnce({
        id: "ta-2",
      });
    const getDb = () => ({}) as AppDb;

    const runId = await createQueuedRun({
      taskName: "pricing.recomputeSnapshot",
      retries: 2,
      deps: {
        insertTaskAudit,
        getDb,
      },
    });

    expect(runId).toEqual(expect.stringMatching(/^job_/));
    expect(insertTaskAudit).toHaveBeenCalledTimes(2);
  });
});
