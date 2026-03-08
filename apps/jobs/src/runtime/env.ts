export const getJobsEnv = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return {
    databaseUrl,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
};
