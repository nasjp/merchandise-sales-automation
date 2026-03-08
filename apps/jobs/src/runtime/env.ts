export const getJobsEnv = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return {
    databaseUrl,
    nodeEnv: process.env.NODE_ENV ?? "development",
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET ?? null,
    slackBotToken: process.env.SLACK_BOT_TOKEN ?? null,
    slackChannelName: process.env.SLACK_CHANNEL_NAME ?? null,
    webBaseUrl: process.env.WEB_BASE_URL ?? null,
  };
};
