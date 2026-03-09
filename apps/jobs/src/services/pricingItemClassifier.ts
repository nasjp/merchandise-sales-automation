import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const HARD_EXCLUDE_KEYWORDS = [
  "ソフト",
  "ゲーム",
  "攻略本",
  "コントローラー",
  "ヘッドセット",
  "ケーブル",
  "カバー",
  "ケース",
  "スタンド",
  "ドック",
  "冷却",
  "リモコン",
  "イヤホン",
  "充電器",
  "アダプター",
  "ジャンク",
  "故障",
  "動作未確認",
  "部品",
] as const;

const normalizeText = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/[_\s-]+/g, " ").trim();

const containsAny = (source: string, keywords: readonly string[]) =>
  keywords.some((keyword) => source.includes(keyword));

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

type PricingTargetForClassifier = {
  sku: string;
  titleKeyword: string;
  modelKeyword: string | null;
};

export class PricingClassificationError extends Error {
  readonly code:
    | "missing_openai_api_key"
    | "llm_classification_failed"
    | "llm_incomplete_decision";

  constructor(params: {
    code:
      | "missing_openai_api_key"
      | "llm_classification_failed"
      | "llm_incomplete_decision";
    message: string;
  }) {
    super(params.message);
    this.name = "PricingClassificationError";
    this.code = params.code;
  }
}

export type PricingCandidateForClassifier = {
  id: string;
  name: string;
  priceYen: number;
};

export type PricingClassificationDecision = {
  id: string;
  include: boolean;
  reason: string;
  confidence: number;
  source: "rule" | "llm" | "fallback";
};

export type PricingClassificationResult = {
  decisions: PricingClassificationDecision[];
  includedIds: string[];
  excludedIds: string[];
  usedLlm: boolean;
  llmError: string | null;
};

type LlmItemDecision = {
  index: number;
  include: boolean;
  confidence: number;
  reasonCode:
    | "include_exact_model"
    | "include_main_unit"
    | "exclude_accessory_or_software"
    | "exclude_parts_or_broken"
    | "exclude_bundle_or_multiple_items"
    | "exclude_wrong_product_family"
    | "exclude_empty_box_or_documents"
    | "exclude_service_or_other"
    | "exclude_ambiguous";
  reason: string;
};

type LlmBatchClassifier = (params: {
  target: PricingTargetForClassifier;
  items: PricingCandidateForClassifier[];
  model: string;
}) => Promise<LlmItemDecision[]>;

const llmDecisionSchema = z.object({
  decisions: z.array(
    z.object({
      index: z.number().int().min(0),
      include: z.boolean(),
      confidence: z.number().min(0).max(1),
      reasonCode: z.enum([
        "include_exact_model",
        "include_main_unit",
        "exclude_accessory_or_software",
        "exclude_parts_or_broken",
        "exclude_bundle_or_multiple_items",
        "exclude_wrong_product_family",
        "exclude_empty_box_or_documents",
        "exclude_service_or_other",
        "exclude_ambiguous",
      ]),
      reason: z.string().min(1).max(120),
    }),
  ),
});

const defaultLlmBatchClassifier = (apiKey: string): LlmBatchClassifier => {
  const openai = createOpenAI({ apiKey });

  return async (params) => {
    const targetInfo = {
      sku: params.target.sku,
      titleKeyword: params.target.titleKeyword,
      modelKeyword: params.target.modelKeyword,
    };
    const items = params.items.map((item, index) => ({
      index,
      id: item.id,
      name: item.name,
      priceYen: item.priceYen,
    }));

    const { object } = await generateObject({
      model: openai(params.model),
      schema: llmDecisionSchema,
      temperature: 0,
      prompt: [
        "あなたは中古ECの成約データ品質審査官です。",
        "目的: target の本体 1 台の売却価格推定に使える成約データだけを include=true にすること。",
        "",
        "判定ルール:",
        "1) include は「対象本体そのものの成約」のみ。標準付属品(純正コントローラー1台・電源ケーブル等)は許容。",
        "2) exclude: ソフト単体、周辺機器、部品、ジャンク/故障、箱のみ、説明書のみ、サービス、互換品。",
        "3) exclude: 複数商品のまとめ売り、複数台セット、別機種混在セット(本体単価が不明になるもの)。",
        "4) SKUや型番一致は強い include 根拠。ただし『対応』『用』など互換アクセサリ文脈なら include しない。",
        "5) 不確実なら include せず exclude_ambiguous を使う。過剰 include を避ける。",
        "6) 全 item に対して必ず 1 判定を返す。index は入力の index と一致させる。",
        "",
        "reasonCode は次から選ぶ:",
        "include_exact_model, include_main_unit, exclude_accessory_or_software, exclude_parts_or_broken, exclude_bundle_or_multiple_items, exclude_wrong_product_family, exclude_empty_box_or_documents, exclude_service_or_other, exclude_ambiguous",
        "",
        `target=${JSON.stringify(targetInfo)}`,
        `items=${JSON.stringify(items)}`,
      ].join("\n"),
    });

    return object.decisions;
  };
};

const classifyByRule = (params: {
  target: PricingTargetForClassifier;
  item: PricingCandidateForClassifier;
}): PricingClassificationDecision | null => {
  const normalizedName = normalizeText(params.item.name);
  const normalizedModel = normalizeText(params.target.modelKeyword ?? "");
  const normalizedSku = normalizeText(params.target.sku);
  const hasHardExclude = containsAny(normalizedName, HARD_EXCLUDE_KEYWORDS);

  const modelMatched =
    normalizedModel.length > 0 && normalizedName.includes(normalizedModel);
  const skuMatched = normalizedSku.length > 0 && normalizedName.includes(normalizedSku);

  if (hasHardExclude && !modelMatched && !skuMatched) {
    return {
      id: params.item.id,
      include: false,
      reason: "rule:obvious_non_hardware",
      confidence: 0.95,
      source: "rule",
    };
  }

  if ((modelMatched || skuMatched) && !hasHardExclude) {
    return {
      id: params.item.id,
      include: true,
      reason: "rule:model_or_sku_match",
      confidence: 0.9,
      source: "rule",
    };
  }

  return null;
};

const withTimeout = async <T>(params: {
  promise: Promise<T>;
  timeoutMs: number;
  label: string;
}): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      params.promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${params.label} timed out in ${params.timeoutMs}ms`));
        }, params.timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const classifyPricingCandidates = async (params: {
  target: PricingTargetForClassifier;
  items: PricingCandidateForClassifier[];
  openAiApiKey: string | null;
  model?: string;
  requireLlm?: boolean;
  minConfidence?: number;
  maxItems?: number;
  batchSize?: number;
  timeoutMs?: number;
  llmBatchClassifier?: LlmBatchClassifier;
}): Promise<PricingClassificationResult> => {
  const minConfidence = Math.max(0, Math.min(1, params.minConfidence ?? 0.6));
  const maxItems = Math.max(1, Math.min(300, params.maxItems ?? 120));
  const batchSize = Math.max(1, Math.min(80, params.batchSize ?? 25));
  const timeoutMs = Math.max(1_000, Math.min(300_000, params.timeoutMs ?? 300_000));
  const model = params.model ?? "gpt-5.4-2026-03-05";
  const requireLlm = params.requireLlm ?? false;

  const limitedItems = params.items.slice(0, maxItems);
  const decisions = new Map<string, PricingClassificationDecision>();
  const unresolved: PricingCandidateForClassifier[] = [];

  for (const item of limitedItems) {
    const ruleDecision = classifyByRule({
      target: params.target,
      item,
    });
    if (ruleDecision) {
      decisions.set(item.id, ruleDecision);
      continue;
    }
    unresolved.push(item);
  }

  let usedLlm = false;
  let llmError: string | null = null;
  if (unresolved.length > 0 && !params.openAiApiKey && requireLlm) {
    throw new PricingClassificationError({
      code: "missing_openai_api_key",
      message: "OPENAI_API_KEY is required for pricing classification",
    });
  }

  if (unresolved.length > 0 && params.openAiApiKey) {
    const llmClassifier =
      params.llmBatchClassifier ?? defaultLlmBatchClassifier(params.openAiApiKey);
    try {
      usedLlm = true;
      for (let offset = 0; offset < unresolved.length; offset += batchSize) {
        const chunk = unresolved.slice(offset, offset + batchSize);
        const llmDecisions = await withTimeout({
          promise: llmClassifier({
            target: params.target,
            items: chunk,
            model,
          }),
          timeoutMs,
          label: "pricing.llmClassifier",
        });

        for (const llmDecision of llmDecisions) {
          const item = chunk[llmDecision.index];
          if (!item) {
            continue;
          }

          const include =
            llmDecision.include && llmDecision.confidence >= minConfidence;
          decisions.set(item.id, {
            id: item.id,
            include,
            reason: `llm:${llmDecision.reasonCode}:${llmDecision.reason}`,
            confidence: llmDecision.confidence,
            source: "llm",
          });
        }
      }
    } catch (error) {
      llmError = toErrorMessage(error);
      if (requireLlm) {
        throw new PricingClassificationError({
          code: "llm_classification_failed",
          message: `pricing classification failed: ${llmError}`,
        });
      }
    }
  }

  if (requireLlm) {
    const unresolvedIds = unresolved
      .filter((item) => !decisions.has(item.id))
      .map((item) => item.id);
    if (unresolvedIds.length > 0) {
      throw new PricingClassificationError({
        code: "llm_incomplete_decision",
        message: `pricing classification incomplete decisions: ${unresolvedIds.join(",")}`,
      });
    }
  }

  for (const item of unresolved) {
    if (decisions.has(item.id)) {
      continue;
    }
    decisions.set(item.id, {
      id: item.id,
      include: false,
      reason: llmError ? "fallback:llm_failed" : "fallback:no_llm",
      confidence: 0.4,
      source: "fallback",
    });
  }

  const allDecisions = limitedItems
    .map((item) => decisions.get(item.id))
    .filter((decision): decision is PricingClassificationDecision =>
      decision !== undefined,
    );

  return {
    decisions: allDecisions,
    includedIds: allDecisions.filter((decision) => decision.include).map((decision) => decision.id),
    excludedIds: allDecisions.filter((decision) => !decision.include).map((decision) => decision.id),
    usedLlm,
    llmError,
  };
};
