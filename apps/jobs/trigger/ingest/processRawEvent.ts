import { traceTask } from "../../src/runtime/telemetry";
import { createQueuedRun } from "../../src/task-helpers/taskAudit";

export const processRawEvent = async (input: { rawEventId: string }) =>
  traceTask({
    name: "ingest.processRawEvent",
    run: async () => {
      const runId = await createQueuedRun({
        taskName: "ingest.processRawEvent",
        payload: input,
      });

      return {
        runId,
        rawEventId: input.rawEventId,
        status: "queued" as const,
      };
    },
  });
