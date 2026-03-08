import { z } from "zod";

export const taskRunStatusSchema = z.enum([
  "queued",
  "running",
  "success",
  "failed",
]);

export const triggerRunResponseSchema = z.object({
  runId: z.string(),
  taskName: z.string(),
  status: taskRunStatusSchema,
  startedAt: z.string().datetime({ offset: true }),
  finishedAt: z.string().datetime({ offset: true }).nullable(),
  payload: z.record(z.unknown()),
});

export const triggerRunReprocessResponseSchema = z.object({
  runId: z.string(),
  requeuedFromRunId: z.string(),
  taskName: z.string(),
  status: z.literal("queued"),
});

export type TaskRunStatus = z.infer<typeof taskRunStatusSchema>;
export type TriggerRunResponse = z.infer<typeof triggerRunResponseSchema>;
export type TriggerRunReprocessResponse = z.infer<
  typeof triggerRunReprocessResponseSchema
>;
