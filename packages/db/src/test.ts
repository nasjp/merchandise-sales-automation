import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

type DbOptions = {
  migrations?: boolean;
  cache?: boolean;
};

type TestDbBase = PgliteDatabase<typeof schema> & { $client: PGlite };
export type TestDb = TestDbBase & AsyncDisposable;

type AsyncDisposeHandler = (client: PGlite) => Promise<void>;

function attachAsyncDispose(
  db: TestDbBase,
  onDispose?: AsyncDisposeHandler,
): TestDb {
  const client = db.$client;
  let disposed = false;

  return Object.assign(db, {
    async [Symbol.asyncDispose]() {
      if (disposed || client.closed) {
        disposed = true;
        return;
      }

      disposed = true;
      if (onDispose) {
        await onDispose(client);
        return;
      }

      await client.close();
    },
  });
}

const baseByKey = new Map<string, Promise<PGlite>>();
const reusableByKey = new Map<string, PGlite[]>();
const truncateSqlByKey = new Map<string, Promise<string | null>>();

function resolveMigrationsFolder() {
  const defaultMigrationsFolder = resolve(
    __dirname,
    "../../../database/migrations",
  );

  return process.env.DATABASE_MIGRATIONS_PATH
    ? resolve(process.cwd(), process.env.DATABASE_MIGRATIONS_PATH)
    : defaultMigrationsFolder;
}

async function getMigratedBaseClient(opts: {
  migrationsFolder: string;
  migrationsSchema: string;
}) {
  const key = `${opts.migrationsSchema}::${opts.migrationsFolder}`;

  let p = baseByKey.get(key);
  if (!p) {
    p = (async () => {
      const client = await PGlite.create();
      const baseDb = drizzle(client, { schema });

      await migrate(baseDb, {
        migrationsFolder: opts.migrationsFolder,
        migrationsSchema: opts.migrationsSchema,
      });

      return client;
    })().catch((error: unknown) => {
      baseByKey.delete(key);
      throw error;
    });

    baseByKey.set(key, p);
  }

  return await p;
}

function takeReusableClient(key: string): PGlite | undefined {
  const pooled = reusableByKey.get(key);
  if (!pooled || pooled.length === 0) {
    return undefined;
  }

  return pooled.pop();
}

function storeReusableClient(key: string, client: PGlite) {
  const pooled = reusableByKey.get(key);
  if (pooled) {
    pooled.push(client);
    return;
  }

  reusableByKey.set(key, [client]);
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function getTruncateSqlForKey(params: {
  key: string;
  client: PGlite;
}): Promise<string | null> {
  const cached = truncateSqlByKey.get(params.key);
  if (cached) {
    return await cached;
  }

  const sqlPromise = params.client
    .query<{ tablename: string }>(
      `
      select tablename
      from pg_tables
      where schemaname = 'public'
        and tablename <> '__drizzle_migrations'
      order by tablename
      `,
    )
    .then((result) => {
      const tableNames = result.rows.map((row) => row.tablename);
      if (tableNames.length === 0) {
        return null;
      }

      const tableList = tableNames.map(quoteIdent).join(", ");
      return `truncate table ${tableList} restart identity cascade;`;
    })
    .catch((error: unknown) => {
      truncateSqlByKey.delete(params.key);
      throw error;
    });

  truncateSqlByKey.set(params.key, sqlPromise);
  return await sqlPromise;
}

async function resetAndStoreReusableClient(params: {
  key: string;
  client: PGlite;
}) {
  try {
    const truncateSql = await getTruncateSqlForKey({
      key: params.key,
      client: params.client,
    });

    if (truncateSql) {
      await params.client.exec(truncateSql);
    }

    storeReusableClient(params.key, params.client);
  } catch {
    if (!params.client.closed) {
      await params.client.close();
    }
  }
}

export const db = async ({
  migrations = true,
  cache = false,
}: DbOptions = {}): Promise<TestDb> => {
  if (!migrations) {
    const migratedDb = drizzle({ schema });
    return attachAsyncDispose(migratedDb);
  }

  const migrationsFolder = resolveMigrationsFolder();
  const migrationsSchema = "public";
  const key = `${migrationsSchema}::${migrationsFolder}`;

  if (!cache) {
    const inMemoryDb = drizzle({ schema });
    await migrate(inMemoryDb, {
      migrationsFolder,
      migrationsSchema,
    });

    return attachAsyncDispose(inMemoryDb);
  }

  const reusableClient = takeReusableClient(key);
  if (reusableClient) {
    const reusedDb = drizzle(reusableClient, { schema });
    return attachAsyncDispose(reusedDb, async (client) => {
      await resetAndStoreReusableClient({
        key,
        client,
      });
    });
  }

  const baseClient = await getMigratedBaseClient({
    migrationsFolder,
    migrationsSchema,
  });

  const clonedClient = await baseClient.clone();
  const client = clonedClient as unknown as PGlite;
  const clonedDb = drizzle(client, { schema });

  return attachAsyncDispose(clonedDb, async (cloned) => {
    await resetAndStoreReusableClient({
      key,
      client: cloned,
    });
  });
};
