import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config";

const lockFile = resolve(config.projectRoot, "logs", "runner.lock");

mkdirSync(resolve(config.projectRoot, "logs"), { recursive: true });

export const acquireLock = (): boolean => {
  if (existsSync(lockFile)) {
    const raw = readFileSync(lockFile, "utf-8").trim();
    const pid = Number(raw);
    if (Number.isFinite(pid) && isProcessAlive(pid)) {
      return false;
    }
    // stale lock — process is dead
    unlinkSync(lockFile);
  }
  writeFileSync(lockFile, String(process.pid));
  return true;
};

export const releaseLock = () => {
  try {
    unlinkSync(lockFile);
  } catch {
    // ignore
  }
};

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
