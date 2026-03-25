import { aiRunsRepo } from "./aiRunsRepo";
import { candidatesRepo } from "./candidatesRepo";
import { jobQueueRepo } from "./jobQueueRepo";
import { rawEventsRepo } from "./rawEventsRepo";
import { snapshotsRepo } from "./snapshotsRepo";
import { targetsRepo } from "./targetsRepo";
import { taskAuditRepo } from "./taskAuditRepo";

export const repositoryLocator = {
  rawEvents: rawEventsRepo,
  targets: targetsRepo,
  snapshots: snapshotsRepo,
  candidates: candidatesRepo,
  aiRuns: aiRunsRepo,
  taskAudit: taskAuditRepo,
  jobQueue: jobQueueRepo,
};
