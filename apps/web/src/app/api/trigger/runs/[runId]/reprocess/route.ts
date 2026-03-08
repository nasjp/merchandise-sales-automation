import { triggerRunReprocessResponseSchema } from "@merchandise/contracts";
import { NextResponse } from "next/server";
import { requeueTriggerRunById } from "@/server/queries/tasks";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { runId } = await context.params;
  if (!runId) {
    return NextResponse.json(
      { error: "runId is required" },
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const requeued = await requeueTriggerRunById(runId);
  if (!requeued) {
    return NextResponse.json(
      { error: "run not found" },
      { status: 404, headers: JSON_HEADERS },
    );
  }

  const response = triggerRunReprocessResponseSchema.parse(requeued);

  return NextResponse.json(response, {
    status: 202,
    headers: JSON_HEADERS,
  });
}
