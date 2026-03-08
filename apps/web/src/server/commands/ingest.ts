import type { AndroidIngestPayload } from "@merchandise/contracts";
import { repositoryLocator } from "@merchandise/db";
import { buildRawEventDedupeKey } from "@/lib/dedupe";
import { getDb } from "@/server/db";
import { generateCandidateFromRawEvent } from "@/server/commands/ingestPipeline";
import { markTaskRunFinished, queueTaskRun } from "@/server/trigger/client";

export const ingestAndroidPayload = async (payload: AndroidIngestPayload) => {
  const db = getDb();
  const receivedAt = payload.receivedAt ? new Date(payload.receivedAt) : new Date();
  const dedupeKey = buildRawEventDedupeKey(payload);

  const { event, deduped } = await repositoryLocator.rawEvents.insertOrGetByDedupe(db, {
    source: "android",
    notificationId: payload.notificationId,
    title: payload.title,
    body: payload.body,
    dedupeKey,
    receivedAt,
  });

  if (!deduped) {
    const run = await queueTaskRun({
      taskName: "ingest.processRawEvent",
      payload: {
        rawEventId: event.id,
      },
    });

    try {
      await generateCandidateFromRawEvent(event.id);
      await markTaskRunFinished({
        runId: run.runId,
        status: "success",
      });
    } catch (error) {
      await markTaskRunFinished({
        runId: run.runId,
        status: "failed",
      });
      throw error;
    }
  }

  return {
    eventId: event.id,
    deduped,
    queued: !deduped,
  };
};
