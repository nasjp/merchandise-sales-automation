import { aiRuns, type AiRun, type NewAiRun } from "../schema";
import type { DB } from "../types";

export type InsertAiRunInput = Pick<
  NewAiRun,
  | "candidateId"
  | "taskName"
  | "provider"
  | "model"
  | "status"
  | "input"
  | "output"
  | "error"
  | "executedAt"
>;

const insert = async (db: DB, input: InsertAiRunInput): Promise<AiRun> => {
  const [row] = await db
    .insert(aiRuns)
    .values({
      candidateId: input.candidateId ?? null,
      taskName: input.taskName,
      provider: input.provider,
      model: input.model,
      status: input.status ?? "success",
      input: input.input ?? {},
      output: input.output ?? {},
      error: input.error ?? null,
      executedAt: input.executedAt ?? new Date(),
    })
    .returning();

  return row;
};

export const aiRunsRepo = {
  insert,
};
