import type { drizzle as drizzlePGLite } from "drizzle-orm/pglite";
import type { drizzle } from "drizzle-orm/postgres-js";
import type * as schema from "./schema";

export type DB =
  | ReturnType<typeof drizzle<typeof schema>>
  | ReturnType<typeof drizzlePGLite<typeof schema>>
  | Parameters<
      Parameters<ReturnType<typeof drizzle<typeof schema>>["transaction"]>[0]
    >[0]
  | Parameters<
      Parameters<
        ReturnType<typeof drizzlePGLite<typeof schema>>["transaction"]
      >[0]
    >[0];
