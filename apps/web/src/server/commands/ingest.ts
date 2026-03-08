import type { AndroidIngestPayload } from "@merchandise/contracts";
import { repositoryLocator } from "@merchandise/db";
import { buildRawEventDedupeKey } from "@/lib/dedupe";
import { queueCandidateSlackNotification } from "@/server/commands/queueCandidateSlackNotification";
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
      const candidate = await generateCandidateFromRawEvent(event.id);
      try {
        await queueCandidateSlackNotification(candidate);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[web] failed to enqueue candidate slack notification", {
          candidateId: candidate.id,
          error: message,
        });
      }

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
