import { appendFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "./config";

const logsDir = resolve(config.projectRoot, "logs");
const logFile = resolve(logsDir, "runner.log");

mkdirSync(logsDir, { recursive: true });

const timestamp = () => new Date().toISOString();

const write = (level: string, message: string, extra?: unknown) => {
  const line = extra
    ? `${timestamp()} [${level}] ${message} ${JSON.stringify(extra)}`
    : `${timestamp()} [${level}] ${message}`;

  console.log(line);
  appendFileSync(logFile, line + "\n");
};

export const logger = {
  info: (message: string, extra?: unknown) => write("INFO", message, extra),
  error: (message: string, extra?: unknown) => write("ERROR", message, extra),
};
