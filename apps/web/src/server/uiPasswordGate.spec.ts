import { describe, expect, test } from "vitest";
import {
  hasValidPasswordCookie,
  normalizeNextPath,
  shouldProtectUi,
} from "./uiPasswordGate";

describe("uiPasswordGate", () => {
  describe("shouldProtectUi", () => {
    test("VERCEL_ENV=production なら true", () => {
      expect(
        shouldProtectUi({
          VERCEL_ENV: "production",
          NODE_ENV: "development",
        }),
      ).toBe(true);
    });

    test("VERCEL_ENV が production 以外なら false", () => {
      expect(
        shouldProtectUi({
          VERCEL_ENV: "preview",
          NODE_ENV: "production",
        }),
      ).toBe(false);
    });

    test("VERCEL_ENV が無い場合は NODE_ENV=production のみ true", () => {
      expect(shouldProtectUi({ NODE_ENV: "production" })).toBe(true);
      expect(shouldProtectUi({ NODE_ENV: "development" })).toBe(false);
    });
  });

  describe("hasValidPasswordCookie", () => {
    test("cookie と password が一致すれば true", () => {
      expect(
        hasValidPasswordCookie({
          cookiePassword: "secret",
          password: "secret",
        }),
      ).toBe(true);
    });

    test("cookie が空なら false", () => {
      expect(
        hasValidPasswordCookie({
          cookiePassword: null,
          password: "secret",
        }),
      ).toBe(false);
    });

    test("cookie が不一致なら false", () => {
      expect(
        hasValidPasswordCookie({
          cookiePassword: "wrong",
          password: "secret",
        }),
      ).toBe(false);
    });
  });

  describe("normalizeNextPath", () => {
    test("安全な相対パスはそのまま通す", () => {
      expect(normalizeNextPath("/targets?status=open")).toBe("/targets?status=open");
    });

    test("空値は / にフォールバック", () => {
      expect(normalizeNextPath(null)).toBe("/");
      expect(normalizeNextPath("")).toBe("/");
    });

    test("絶対URLや不正パスは / にフォールバック", () => {
      expect(normalizeNextPath("https://example.com")).toBe("/");
      expect(normalizeNextPath("//example.com")).toBe("/");
      expect(normalizeNextPath("targets")).toBe("/");
    });

    test("/unlock への戻り先は / にフォールバック", () => {
      expect(normalizeNextPath("/unlock")).toBe("/");
      expect(normalizeNextPath("/unlock?next=/targets")).toBe("/");
    });
  });
});
