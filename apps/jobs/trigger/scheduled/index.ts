import { retryStuckRuns } from "../maintenance/retryStuckRuns";
import { cleanupOldArtifacts } from "../maintenance/cleanupOldArtifacts";
import { refreshDueTargets } from "../pricing/refreshDueTargets";

export const scheduledRefreshDueTargets = async () => {
  return await refreshDueTargets();
};

export const scheduledRetryStuckRuns = async () => {
  return await retryStuckRuns();
};

export const scheduledCleanupOldArtifacts = async () => {
  return await cleanupOldArtifacts({
    days: 30,
  });
};

export const jobSchedules = [
  {
    id: "pricing.refreshDueTargets.daily",
    cron: "0 3 * * *",
    task: "scheduledRefreshDueTargets",
  },
  {
    id: "maintenance.retryStuckRuns.every10m",
    cron: "*/10 * * * *",
    task: "scheduledRetryStuckRuns",
  },
  {
    id: "maintenance.cleanupOldArtifacts.daily",
    cron: "0 4 * * *",
    task: "scheduledCleanupOldArtifacts",
  },
] as const;
