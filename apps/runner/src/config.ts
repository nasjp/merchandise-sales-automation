import { resolve } from "node:path";

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
};

export const config = {
  databaseUrl: requireEnv("DATABASE_URL"),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 10000),
  errorBackoffMs: Number(process.env.ERROR_BACKOFF_MS ?? 10000),
  projectRoot: resolve(__dirname, "../../.."),
};
