export const jobsLogger = {
  info: (message: string, payload?: Record<string, unknown>) => {
    console.info(`[jobs] ${message}`, payload ?? {});
  },
  error: (message: string, payload?: Record<string, unknown>) => {
    console.error(`[jobs] ${message}`, payload ?? {});
  },
};
