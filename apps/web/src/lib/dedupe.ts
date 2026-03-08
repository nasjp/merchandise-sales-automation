import { createHash } from "node:crypto";
import type { AndroidIngestPayload } from "@merchandise/contracts";

export const buildRawEventDedupeKey = (payload: AndroidIngestPayload): string => {
  const source = [
    payload.notificationId ?? "",
    payload.title,
    payload.body,
    payload.receivedAt ?? "",
  ].join("|");

  return createHash("sha256").update(source).digest("hex");
};
