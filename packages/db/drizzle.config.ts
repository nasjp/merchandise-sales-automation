import { defineConfig } from "drizzle-kit";

const localPort = process.env.POSTGRES_HOST_PORT ?? "55444";
const localDatabaseUrl = `postgresql://postgres:postgres@127.0.0.1:${localPort}/postgres`;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "../../database/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
  strict: true,
  verbose: true,
});
