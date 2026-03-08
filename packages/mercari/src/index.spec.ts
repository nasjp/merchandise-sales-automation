import { describe, expect, test } from "vitest";
import { parseMercariNotification } from "./parser";

describe("parseMercariNotification", () => {
  const cases = [
    {
      name: "価格と型番を抽出できる",
      input: {
        title: "PlayStation 5 CFI-2000 本体 49,800円",
        body: "送料込み・美品",
      },
      want: {
        priceYen: 49800,
        modelText: "CFI-2000",
        shipping: "seller",
        condition: "used_good",
        isJunk: false,
      },
    },
    {
      name: "ジャンク語彙を検知できる",
      input: {
        title: "Nintendo Switch HAC001 ジャンク",
        body: "動作未確認 着払い",
      },
      want: {
        priceYen: null,
        modelText: "HAC001",
        shipping: "buyer",
        condition: "junk",
        isJunk: true,
      },
    },
    {
      name: "価格だけ本文から抽出できる",
      input: {
        title: "iPhone 13 mini",
        body: "状態良好 85,000円 送料無料",
      },
      want: {
        priceYen: 85000,
        modelText: null,
        shipping: "seller",
        condition: "used_good",
        isJunk: false,
      },
    },
  ] as const;

  test.each(cases)("$name", (tc) => {
    const got = parseMercariNotification(tc.input);
    expect(got).toMatchObject(tc.want);
  });
});
