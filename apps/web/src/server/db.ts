import { createDb } from "@merchandise/db";

export const getDb = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  return createDb(dbUrl);
};
