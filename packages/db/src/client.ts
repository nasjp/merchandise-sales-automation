import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const createDb = (url: string) =>
  drizzle({
    client: postgres(url, { prepare: false }),
    schema,
  });

export type AppDb = ReturnType<typeof createDb>;
