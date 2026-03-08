import { describe, expect, test } from "vitest";
import {
  createDeterministicProvider,
  extractListingAttributes,
  parseListingAttributesOutput,
  type LlmProviderAdapter,
} from "./index";

describe("parseListingAttributesOutput", () => {
  const cases = [
    {
      name: "JSON文字列をそのまま parse できる",
      input:
        '{"modelText":"CFI-2000","condition":"used_good","shipping":"seller","priceYenHint":49800,"confidence":0.82}',
      want: {
        modelText: "CFI-2000",
        condition: "used_good",
        shipping: "seller",
        priceYenHint: 49800,
        confidence: 0.82,
      },
    },
    {
      name: "fenced code block から JSON を抽出できる",
      input: [
        "```json",
        '{"modelText":null,"condition":"unknown","shipping":"unknown","priceYenHint":null,"confidence":0.3}',
        "```",
      ].join("\n"),
      want: {
        modelText: null,
        condition: "unknown",
        shipping: "unknown",
        priceYenHint: null,
        confidence: 0.3,
      },
    },
  ] as const;

  test.each(cases)("$name", (tc) => {
    const got = parseListingAttributesOutput(tc.input);
    expect(got).toEqual(tc.want);
  });
});

describe("extractListingAttributes", () => {
  test("正常系: deterministic provider で属性を抽出できる", async () => {
    const provider = createDeterministicProvider();

    const got = await extractListingAttributes({
      provider,
      model: "deterministic-v1",
      input: {
        title: "PlayStation 5 CFI-2000 本体 49,800円",
        body: "送料込み 状態良好",
      },
    });

    expect(got.attributes).toMatchObject({
      modelText: "CFI-2000",
      condition: "used_good",
      shipping: "seller",
      priceYenHint: 49800,
    });
    expect(got.audit.attempts).toHaveLength(1);
    expect(got.audit.attempts[0]?.status).toBe("success");
  });

  test("正常系: parse 失敗時に retry して成功できる", async () => {
    let calls = 0;
    const flakyProvider: LlmProviderAdapter = {
      provider: "flaky-test",
      generate: async () => {
        calls += 1;
        if (calls === 1) {
          return {
            text: "not-json",
          };
        }

        return {
          text: '{"modelText":"CFI-2000","condition":"used_good","shipping":"seller","priceYenHint":50000,"confidence":0.9}',
        };
      },
    };

    const got = await extractListingAttributes({
      provider: flakyProvider,
      model: "flaky-v1",
      input: {
        title: "title",
        body: "body",
      },
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: 0,
      },
    });

    expect(got.attributes).toMatchObject({
      modelText: "CFI-2000",
      priceYenHint: 50000,
    });
    expect(got.audit.attempts).toHaveLength(2);
    expect(got.audit.attempts[0]).toMatchObject({
      status: "failed",
    });
    expect(got.audit.attempts[1]).toMatchObject({
      status: "success",
    });
  });

  test("異常系: timeout すると失敗する", async () => {
    const neverProvider: LlmProviderAdapter = {
      provider: "never",
      generate: async () =>
        await new Promise<{ text: string }>(() => undefined),
    };

    await expect(
      extractListingAttributes({
        provider: neverProvider,
        model: "never-v1",
        input: {
          title: "title",
          body: "body",
        },
        retryPolicy: {
          maxAttempts: 1,
          timeoutMs: 10,
          backoffMs: 0,
        },
      }),
    ).rejects.toThrow("timed out");
  });
});
