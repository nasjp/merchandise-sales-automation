import type { LlmProviderAdapter } from "./provider";
import { withTimeout } from "./retry";

export type ExplainOutlierResult = {
  summary: string;
  provider: string;
  model: string;
};

export const explainOutlier = async (params: {
  provider: LlmProviderAdapter;
  model: string;
  input: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<ExplainOutlierResult> => {
  const response = await withTimeout({
    promise: params.provider.generate({
      model: params.model,
      messages: [
        {
          role: "system",
          content: "あなたは価格異常検知の要因を短く説明するアシスタントです。",
        },
        {
          role: "user",
          content: JSON.stringify(params.input),
        },
      ],
      metadata: {
        task: "explainOutlier",
        payload: params.input,
      },
    }),
    timeoutMs: params.timeoutMs ?? 1_500,
    label: "llm.explainOutlier",
  });

  return {
    summary: response.text.trim(),
    provider: params.provider.provider,
    model: params.model,
  };
};
