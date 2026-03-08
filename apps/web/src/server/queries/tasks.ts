import { findTaskRun, requeueTaskRun } from "@/server/trigger/client";

export const findTriggerRunById = async (runId: string) => {
  return await findTaskRun(runId);
};

export const requeueTriggerRunById = async (runId: string) => {
  return await requeueTaskRun(runId);
};
