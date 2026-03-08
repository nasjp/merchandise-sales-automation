import { desc, eq } from "drizzle-orm";
import { rawEvents, type NewRawEvent, type RawEvent } from "../schema";
import type { DB } from "../types";

export type InsertRawEventInput = Pick<
  NewRawEvent,
  "source" | "notificationId" | "title" | "body" | "dedupeKey" | "receivedAt"
>;

const findByDedupeKey = async (
  db: DB,
  dedupeKey: string,
): Promise<RawEvent | null> => {
  const [row] = await db
    .select()
    .from(rawEvents)
    .where(eq(rawEvents.dedupeKey, dedupeKey))
    .limit(1);

  return row ?? null;
};

const findById = async (db: DB, id: string): Promise<RawEvent | null> => {
  const [row] = await db.select().from(rawEvents).where(eq(rawEvents.id, id)).limit(1);
  return row ?? null;
};

const insert = async (db: DB, input: InsertRawEventInput): Promise<RawEvent> => {
  const [inserted] = await db
    .insert(rawEvents)
    .values({
      source: input.source ?? "android",
      notificationId: input.notificationId ?? null,
      title: input.title,
      body: input.body,
      dedupeKey: input.dedupeKey,
      receivedAt: input.receivedAt,
    })
    .returning();

  return inserted;
};

const insertOrGetByDedupe = async (
  db: DB,
  input: InsertRawEventInput,
): Promise<{ event: RawEvent; deduped: boolean }> => {
  const [inserted] = await db
    .insert(rawEvents)
    .values({
      source: input.source ?? "android",
      notificationId: input.notificationId ?? null,
      title: input.title,
      body: input.body,
      dedupeKey: input.dedupeKey,
      receivedAt: input.receivedAt,
    })
    .onConflictDoNothing({ target: rawEvents.dedupeKey })
    .returning();

  if (inserted) {
    return {
      event: inserted,
      deduped: false,
    };
  }

  const existing = await findByDedupeKey(db, input.dedupeKey);
  if (!existing) {
    throw new Error("raw event insert conflicted but existing row was not found");
  }

  return {
    event: existing,
    deduped: true,
  };
};

const findRecent = async (db: DB, limit = 50): Promise<RawEvent[]> => {
  return await db
    .select()
    .from(rawEvents)
    .orderBy(desc(rawEvents.receivedAt), desc(rawEvents.createdAt))
    .limit(limit);
};

const markProcessed = async (
  db: DB,
  input: {
    id: string;
    processedAt?: Date;
  },
): Promise<RawEvent | null> => {
  const [row] = await db
    .update(rawEvents)
    .set({
      processedAt: input.processedAt ?? new Date(),
    })
    .where(eq(rawEvents.id, input.id))
    .returning();

  return row ?? null;
};

export const rawEventsRepo = {
  findById,
  findByDedupeKey,
  insert,
  insertOrGetByDedupe,
  findRecent,
  markProcessed,
};
