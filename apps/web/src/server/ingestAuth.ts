import { createHmac, timingSafeEqual } from "node:crypto";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const normalizeSignature = (value: string) =>
  value.startsWith("sha256=") ? value.slice("sha256=".length) : value;

const toBuffer = (hex: string): Buffer | null => {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    return null;
  }

  try {
    return Buffer.from(hex, "hex");
  } catch {
    return null;
  }
};

export const verifyIngestSignature = (params: {
  secret: string;
  rawBody: string;
  timestamp: string;
  signature: string;
  now?: number;
}): boolean => {
  const timestampMs = Number(params.timestamp);
  if (!Number.isFinite(timestampMs)) {
    return false;
  }

  const now = params.now ?? Date.now();
  if (Math.abs(now - timestampMs) > FIVE_MINUTES_MS) {
    return false;
  }

  const message = `${params.timestamp}.${params.rawBody}`;
  const expected = createHmac("sha256", params.secret).update(message).digest("hex");

  const expectedBuffer = toBuffer(expected);
  const actualBuffer = toBuffer(normalizeSignature(params.signature));
  if (!expectedBuffer || !actualBuffer || expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};
