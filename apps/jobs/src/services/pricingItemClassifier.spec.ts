import { describe, expect, test } from "vitest";
import {
  PricingClassificationError,
  classifyPricingCandidates,
} from "./pricingItemClassifier";

const target = {
  sku: "PS5-CFI-2000",
  titleKeyword: "PlayStation 5",
  modelKeyword: "CFI-2000",
};

describe("pricingItemClassifier", () => {
  const expectRejectCode = async (
    promise: Promise<unknown>,
    code: PricingClassificationError["code"],
  ) => {
    const error = await promise.catch((caught) => caught);
    expect(error).toBeInstanceOf(PricingClassificationError);
    expect((error as PricingClassificationError).code).toBe(code);
  };

  test("ルールベースで本体は include / 周辺機器は exclude できる", async () => {
    const result = await classifyPricingCandidates({
      target,
      openAiApiKey: null,
      requireLlm: false,
      items: [
        {
          id: "console",
          name: "PlayStation 5 本体 CFI-2000A01",
          priceYen: 62_000,
        },
        {
          id: "pad",
          name: "PS5 コントローラー DualSense",
          priceYen: 6_500,
        },
      ],
    });

    expect(result.includedIds).toEqual(["console"]);
    expect(result.excludedIds).toEqual(["pad"]);
    expect(result.usedLlm).toBe(false);
  });

  test("requireLlm=true で API key がない場合は失敗する", async () => {
    await expectRejectCode(
      classifyPricingCandidates({
        target,
        openAiApiKey: null,
        requireLlm: true,
        items: [
          {
            id: "unknown-1",
            name: "PlayStation 5 セット",
            priceYen: 55_000,
          },
        ],
      }),
      "missing_openai_api_key",
    );
  });

  test("requireLlm=true で LLM 失敗時は失敗する", async () => {
    await expectRejectCode(
      classifyPricingCandidates({
        target,
        openAiApiKey: "test-key",
        requireLlm: true,
        items: [
          {
            id: "unknown-2",
            name: "PS5 まとめ売り",
            priceYen: 49_000,
          },
        ],
        llmBatchClassifier: async () => {
          throw new Error("429 too many requests");
        },
      }),
      "llm_classification_failed",
    );
  });

  test("requireLlm=true で LLM が一部判定を返さない場合は失敗する", async () => {
    await expectRejectCode(
      classifyPricingCandidates({
        target,
        openAiApiKey: "test-key",
        requireLlm: true,
        items: [
          {
            id: "unknown-3",
            name: "PS5 ディスク版",
            priceYen: 58_000,
          },
        ],
        llmBatchClassifier: async () => [],
      }),
      "llm_incomplete_decision",
    );
  });

  test("型番一致でも周辺機器語を含む場合は rule で即 include しない", async () => {
    await expectRejectCode(
      classifyPricingCandidates({
        target,
        openAiApiKey: null,
        requireLlm: true,
        items: [
          {
            id: "ambiguous-1",
            name: "PS5 CFI-2000 対応 コントローラー 新品",
            priceYen: 7_200,
          },
        ],
      }),
      "missing_openai_api_key",
    );
  });
});
