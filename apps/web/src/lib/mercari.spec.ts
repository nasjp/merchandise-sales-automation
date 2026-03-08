import { describe, expect, test } from "vitest";
import {
  buildMercariSearchUrl,
  extractMercariItemUrl,
  resolveMercariLink,
} from "./mercari";

describe("extractMercariItemUrl", () => {
  test("item URL を抽出する", () => {
    const got = extractMercariItemUrl({
      title: "出品を見てください",
      body: "https://jp.mercari.com/item/m12345678901",
    });
    expect(got).toBe("https://jp.mercari.com/item/m12345678901");
  });

  test("末尾記号を除去して抽出する", () => {
    const got = extractMercariItemUrl({
      title: "新着",
      body: "jp.mercari.com/item/m12345678901。",
    });
    expect(got).toBe("https://jp.mercari.com/item/m12345678901");
  });

  test("item URL がない場合は null を返す", () => {
    const got = extractMercariItemUrl({
      title: "PlayStation 5",
      body: "リンクなし",
    });
    expect(got).toBeNull();
  });
});

describe("resolveMercariLink", () => {
  test("item URL があれば item リンクを返す", () => {
    const got = resolveMercariLink({
      title: "PS5",
      body: "https://jp.mercari.com/item/m12345678901",
    });
    expect(got).toEqual({
      href: "https://jp.mercari.com/item/m12345678901",
      type: "item",
    });
  });

  test("item URL がなければ検索リンクを返す", () => {
    const got = resolveMercariLink({
      title: "PlayStation 5 CFI-2000",
      body: "リンクなし",
    });
    expect(got).toEqual({
      href: buildMercariSearchUrl("PlayStation 5 CFI-2000"),
      type: "search",
    });
  });
});
