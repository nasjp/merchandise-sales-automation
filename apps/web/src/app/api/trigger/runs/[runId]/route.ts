import {
  taskRunStatusSchema,
  triggerRunResponseSchema,
  type TaskRunStatus,
} from "@merchandise/contracts";
import { NextResponse } from "next/server";
import { findTriggerRunById } from "@/server/queries/tasks";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

const normalizeStatus = (value: string): TaskRunStatus => {
  const parsed = taskRunStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "failed";
};

export async function GET(_: Request, context: RouteContext) {
  const { runId } = await context.params;
  if (!runId) {
    return NextResponse.json(
      { error: "runId is required" },
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const run = await findTriggerRunById(runId);
  if (!run) {
    return NextResponse.json(
      { error: "run not found" },
      { status: 404, headers: JSON_HEADERS },
    );
  }

  const response = triggerRunResponseSchema.parse({
    runId: run.runId,
    taskName: run.taskName,
    status: normalizeStatus(run.status),
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    payload: run.payload,
  });

  return NextResponse.json(response, {
    status: 200,
    headers: JSON_HEADERS,
  });
}
