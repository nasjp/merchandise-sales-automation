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
