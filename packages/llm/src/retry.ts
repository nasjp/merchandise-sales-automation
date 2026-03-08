export type RetryPolicy = {
  maxAttempts: number;
  timeoutMs: number;
  backoffMs: number;
};

export type RetryAttemptLog = {
  attempt: number;
  elapsedMs: number;
  status: "success" | "failed";
  error?: string;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 2,
  timeoutMs: 1_500,
  backoffMs: 50,
};

export const mergeRetryPolicy = (
  input?: Partial<RetryPolicy>,
): RetryPolicy => ({
  maxAttempts: input?.maxAttempts ?? defaultRetryPolicy.maxAttempts,
  timeoutMs: input?.timeoutMs ?? defaultRetryPolicy.timeoutMs,
  backoffMs: input?.backoffMs ?? defaultRetryPolicy.backoffMs,
});

export const withTimeout = async <T>(params: {
  promise: Promise<T>;
  timeoutMs: number;
  label: string;
}): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      params.promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${params.label} timed out in ${params.timeoutMs}ms`));
        }, params.timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const sleep = async (ms: number): Promise<void> => {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};
