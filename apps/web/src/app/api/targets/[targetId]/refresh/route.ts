import { targetRefreshResponseSchema } from "@merchandise/contracts";
import { NextResponse } from "next/server";
import { queueTargetRefresh } from "@/server/commands/targets";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

type RouteContext = {
  params: Promise<{
    targetId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { targetId } = await context.params;
  if (!targetId) {
    return NextResponse.json(
      { error: "targetId is required" },
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const queued = await queueTargetRefresh(targetId);
  if (!queued) {
    return NextResponse.json(
      { error: "target not found" },
      { status: 404, headers: JSON_HEADERS },
    );
  }

  const response = targetRefreshResponseSchema.parse({
    runId: queued.runId,
    targetId: queued.targetId,
    taskName: queued.taskName,
    status: queued.status,
  });

  return NextResponse.json(response, {
    status: 202,
    headers: JSON_HEADERS,
  });
}
