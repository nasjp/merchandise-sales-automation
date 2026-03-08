import {
  createDeterministicProvider,
  explainOutlier as explainOutlierWithLlm,
  extractListingAttributes as extractListingAttributesWithLlm,
} from "@merchandise/llm";

const provider = createDeterministicProvider();
const model = "deterministic-v1";

export const llmFactory = {
  extractListingAttributes: async (input: { title: string; body: string }) => {
    const result = await extractListingAttributesWithLlm({
      provider,
      model,
      input,
    });
    return result.attributes;
  },
  explainOutlier: async (input: Record<string, unknown>) => {
    const result = await explainOutlierWithLlm({
      provider,
      model,
      input,
    });

    return {
      summary: result.summary,
      input,
    };
  },
};
