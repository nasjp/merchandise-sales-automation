import { llmFactory } from "../../src/factories/llm";

export const explainOutlier = async (input: Record<string, unknown>) => {
  return await llmFactory.explainOutlier(input);
};
