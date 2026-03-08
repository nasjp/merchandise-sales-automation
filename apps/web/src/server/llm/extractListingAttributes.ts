import {
  createDeterministicProvider,
  extractListingAttributes,
  type ExtractListingAttributesResult,
} from "@merchandise/llm";

export const DEFAULT_LISTING_ATTRIBUTES_PROVIDER = "deterministic";
export const DEFAULT_LISTING_ATTRIBUTES_MODEL = "deterministic-v1";

const provider = createDeterministicProvider();

export const extractListingAttributesWithLlm = async (input: {
  title: string;
  body: string;
}): Promise<ExtractListingAttributesResult> => {
  return await extractListingAttributes({
    provider,
    model: DEFAULT_LISTING_ATTRIBUTES_MODEL,
    input,
    retryPolicy: {
      maxAttempts: 2,
      timeoutMs: 500,
      backoffMs: 20,
    },
  });
};
