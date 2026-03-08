import { configure, tasks } from "@trigger.dev/sdk/v3";

const DEFAULT_TRIGGER_API_BASE_URL = "https://api.trigger.dev";

const resolveTriggerTaskId = (taskName: string): string | null => {
  switch (taskName) {
    case "pricing.recomputeSnapshot":
      return "pricing-recompute-snapshot";
    case "candidates.notifySlack":
      return "candidates-notify-slack";
    default:
      return null;
  }
};

const resolveTriggerAccessToken = () => {
  return (
    process.env.TRIGGER_API_KEY ??
    process.env.TRIGGER_SECRET_KEY ??
    process.env.TRIGGER_ACCESS_TOKEN ??
    null
  );
};

const buildTriggerPayload = (params: {
  taskName: string;
  runId: string;
  payload: Record<string, unknown>;
}) => {
  if (params.taskName === "pricing.recomputeSnapshot") {
    const targetId = params.payload.targetId;
    if (typeof targetId !== "string" || targetId.length === 0) {
      throw new Error("targetId is required for pricing.recomputeSnapshot");
    }

    return {
      targetId,
      runId: params.runId,
    };
  }

  if (params.taskName === "candidates.notifySlack") {
    const candidateId = params.payload.candidateId;
    const listingTitle = params.payload.listingTitle;
    const listingPriceYen = params.payload.listingPriceYen;
    const score = params.payload.score;
    const reason = params.payload.reason;

    if (typeof candidateId !== "string" || candidateId.length === 0) {
      throw new Error("candidateId is required for candidates.notifySlack");
    }
    if (typeof listingTitle !== "string" || listingTitle.length === 0) {
      throw new Error("listingTitle is required for candidates.notifySlack");
    }
    if (typeof listingPriceYen !== "number" || !Number.isFinite(listingPriceYen)) {
      throw new Error("listingPriceYen must be a finite number for candidates.notifySlack");
    }
    if (typeof score !== "number" || !Number.isFinite(score)) {
      throw new Error("score must be a finite number for candidates.notifySlack");
    }
    if (reason !== null && reason !== undefined && typeof reason !== "string") {
      throw new Error("reason must be string | null for candidates.notifySlack");
    }

    return {
      runId: params.runId,
      candidateId,
      listingTitle,
      listingPriceYen,
      score,
      reason: reason ?? null,
    };
  }

  return null;
};

export const dispatchTaskRun = async (params: {
  taskName: string;
  runId: string;
  payload: Record<string, unknown>;
}) => {
  const taskId = resolveTriggerTaskId(params.taskName);
  if (!taskId) {
    return false;
  }

  const accessToken = resolveTriggerAccessToken();
  if (!accessToken) {
    throw new Error(
      "TRIGGER_API_KEY (or TRIGGER_SECRET_KEY / TRIGGER_ACCESS_TOKEN) is not configured",
    );
  }

  const triggerPayload = buildTriggerPayload(params);
  if (!triggerPayload) {
    return false;
  }

  configure({
    baseURL: process.env.TRIGGER_API_BASE_URL ?? DEFAULT_TRIGGER_API_BASE_URL,
    accessToken,
  });

  await tasks.trigger(taskId, triggerPayload, {
    idempotencyKey: `task_audit:${params.runId}`,
    tags: [`taskName:${params.taskName}`, `runId:${params.runId}`],
  });

  return true;
};
