export type LlmMessageRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type LlmProviderRequest = {
  model: string;
  messages: readonly LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
  metadata?: Record<string, unknown>;
};

export type LlmProviderResponse = {
  text: string;
  raw?: unknown;
};

export type LlmProviderAdapter = {
  readonly provider: string;
  generate(input: LlmProviderRequest): Promise<LlmProviderResponse>;
};
