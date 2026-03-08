import { z } from "zod";

export const androidIngestPayloadSchema = z.object({
  notificationId: z.string().min(1).max(128).optional(),
  title: z.string().min(1).max(512),
  body: z.string().min(1).max(4000),
  receivedAt: z.string().datetime({ offset: true }).optional(),
  sourcePackage: z.string().min(1).max(255).optional(),
});

export type AndroidIngestPayload = z.infer<typeof androidIngestPayloadSchema>;

export const androidIngestResponseSchema = z.object({
  eventId: z.string(),
  deduped: z.boolean(),
  queued: z.boolean(),
});

export type AndroidIngestResponse = z.infer<typeof androidIngestResponseSchema>;
