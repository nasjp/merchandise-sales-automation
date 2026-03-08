import { createDb, type AppDb } from "@merchandise/db";
import { getJobsEnv } from "../runtime/env";

export const getJobsDb = (): AppDb => {
  const env = getJobsEnv();
  return createDb(env.databaseUrl);
};
