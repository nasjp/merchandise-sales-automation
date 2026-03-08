import { z } from "zod";

export const targetRefreshRequestSchema = z.object({
  targetId: z.string().min(1),
});

export const targetRefreshResponseSchema = z.object({
  runId: z.string(),
  targetId: z.string(),
  taskName: z.literal("pricing.recomputeSnapshot"),
  status: z.literal("queued"),
});

export type TargetRefreshRequest = z.infer<typeof targetRefreshRequestSchema>;
export type TargetRefreshResponse = z.infer<typeof targetRefreshResponseSchema>;
