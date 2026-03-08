import {
  candidateRejectPayloadSchema,
  candidateReviewResponseSchema,
} from "@merchandise/contracts";
import { NextResponse } from "next/server";
import { rejectCandidate } from "@/server/commands/candidates";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

type RouteContext = {
  params: Promise<{
    candidateId: string;
  }>;
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

const notFound = () =>
  NextResponse.json(
    {
      error: "candidate not found",
    },
    {
      status: 404,
      headers: JSON_HEADERS,
    },
  );

const parseJsonBody = async (request: Request): Promise<unknown> => {
  const raw = await request.text();
  if (raw.trim().length === 0) {
    return {};
  }

  return JSON.parse(raw) as unknown;
};

export async function POST(request: Request, context: RouteContext) {
  const { candidateId } = await context.params;
  if (!candidateId) {
    return badRequest("candidateId is required");
  }

  let json: unknown;
  try {
    json = await parseJsonBody(request);
  } catch {
    return badRequest("request body must be valid JSON");
  }

  const parsed = candidateRejectPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "invalid payload");
  }

  const updated = await rejectCandidate({
    candidateId,
    reason: parsed.data.reason,
  });

  if (!updated) {
    return notFound();
  }

  const response = candidateReviewResponseSchema.parse({
    candidateId: updated.id,
    reviewState: updated.reviewState,
    reason: updated.reason,
    updatedAt: updated.updatedAt.toISOString(),
  });

  return NextResponse.json(response, {
    status: 200,
    headers: JSON_HEADERS,
  });
}
