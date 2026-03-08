import type { LlmProviderAdapter } from "./provider";
import {
  EXTRACT_LISTING_ATTRIBUTES_PROMPT_VERSION,
  buildExtractListingAttributesPrompt,
} from "./prompts";
import {
  mergeRetryPolicy,
  sleep,
  withTimeout,
  type RetryAttemptLog,
  type RetryPolicy,
} from "./retry";
import {
  parseListingAttributesOutput,
  type ListingAttributes,
} from "./structuredOutput";

export type ExtractListingAttributesInput = {
  title: string;
  body: string;
};

export type ExtractListingAttributesAudit = {
  provider: string;
  model: string;
  promptVersion: string;
  policy: RetryPolicy;
  startedAt: Date;
  finishedAt: Date;
  attempts: RetryAttemptLog[];
};

export type ExtractListingAttributesResult = {
  attributes: ListingAttributes;
  rawText: string;
  audit: ExtractListingAttributesAudit;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export const extractListingAttributes = async (params: {
  provider: LlmProviderAdapter;
  model: string;
  input: ExtractListingAttributesInput;
  retryPolicy?: Partial<RetryPolicy>;
}): Promise<ExtractListingAttributesResult> => {
  const policy = mergeRetryPolicy(params.retryPolicy);
  const prompt = buildExtractListingAttributesPrompt(params.input);
  const attempts: RetryAttemptLog[] = [];
  const startedAt = new Date();

  let latestError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    const attemptStartedAt = Date.now();

    try {
      const response = await withTimeout({
        promise: params.provider.generate({
          model: params.model,
          responseFormat: "json_object",
          messages: prompt.messages,
          metadata: {
            task: "extractListingAttributes",
            promptVersion: EXTRACT_LISTING_ATTRIBUTES_PROMPT_VERSION,
            title: params.input.title,
            body: params.input.body,
          },
        }),
        timeoutMs: policy.timeoutMs,
        label: "llm.extractListingAttributes",
      });

      const attributes = parseListingAttributesOutput(response.text);
      attempts.push({
        attempt,
        elapsedMs: Date.now() - attemptStartedAt,
        status: "success",
      });

      return {
        attributes,
        rawText: response.text,
        audit: {
          provider: params.provider.provider,
          model: params.model,
          promptVersion: EXTRACT_LISTING_ATTRIBUTES_PROMPT_VERSION,
          policy,
          startedAt,
          finishedAt: new Date(),
          attempts,
        },
      };
    } catch (error) {
      latestError = error;
      attempts.push({
        attempt,
        elapsedMs: Date.now() - attemptStartedAt,
        status: "failed",
        error: toErrorMessage(error),
      });

      if (attempt < policy.maxAttempts) {
        await sleep(policy.backoffMs * attempt);
      }
    }
  }

  throw new Error(
    `extractListingAttributes failed after ${policy.maxAttempts} attempts: ${toErrorMessage(latestError)}`,
  );
};
