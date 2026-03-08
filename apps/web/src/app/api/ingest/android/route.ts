import { androidIngestPayloadSchema } from "@merchandise/contracts";
import { NextResponse } from "next/server";
import { ingestAndroidPayload } from "@/server/commands/ingest";
import { verifyIngestSignature } from "@/server/ingestAuth";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

const badRequest = (error: string) =>
  NextResponse.json(
    {
      error,
    },
    {
      status: 400,
      headers: JSON_HEADERS,
    },
  );

export async function POST(request: Request) {
  const secret = process.env.ANDROID_INGEST_SHARED_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        error: "ANDROID_INGEST_SHARED_SECRET is not configured",
      },
      {
        status: 500,
        headers: JSON_HEADERS,
      },
    );
  }

  const timestamp = request.headers.get("x-ingest-timestamp");
  const signature = request.headers.get("x-ingest-signature");

  if (!timestamp || !signature) {
    return NextResponse.json(
      {
        error: "signature headers are required",
      },
      {
        status: 401,
        headers: JSON_HEADERS,
      },
    );
  }

  const rawBody = await request.text();
  const verified = verifyIngestSignature({
    secret,
    rawBody,
    timestamp,
    signature,
  });

  if (!verified) {
    return NextResponse.json(
      {
        error: "invalid signature",
      },
      {
        status: 401,
        headers: JSON_HEADERS,
      },
    );
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(rawBody) as unknown;
  } catch {
    return badRequest("request body must be valid JSON");
  }

  const parsed = androidIngestPayloadSchema.safeParse(payloadJson);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "invalid payload");
  }

  const result = await ingestAndroidPayload(parsed.data);

  return NextResponse.json(
    {
      eventId: result.eventId,
      deduped: result.deduped,
      queued: result.queued,
    },
    {
      status: result.deduped ? 200 : 202,
      headers: JSON_HEADERS,
    },
  );
}
