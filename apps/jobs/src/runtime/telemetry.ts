export const traceTask = async <T>(params: {
  name: string;
  run: () => Promise<T>;
}): Promise<T> => {
  const startedAt = Date.now();
  try {
    return await params.run();
  } finally {
    const elapsed = Date.now() - startedAt;
    console.info(`[jobs] task=${params.name} elapsedMs=${elapsed}`);
  }
};
