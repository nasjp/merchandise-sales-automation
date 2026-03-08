import { describe, expect, test } from "vitest";
import { isAuthorizedByPassword, shouldProtectUi } from "./uiPasswordGate";

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

  describe("isAuthorizedByPassword", () => {
    test("Basic 認証で password が一致すれば true", () => {
      const token = Buffer.from("user:secret").toString("base64");

      expect(
        isAuthorizedByPassword({
          authorizationHeader: `Basic ${token}`,
          password: "secret",
        }),
      ).toBe(true);
    });

    test("ヘッダーが無いと false", () => {
      expect(
        isAuthorizedByPassword({
          authorizationHeader: null,
          password: "secret",
        }),
      ).toBe(false);
    });

    test("scheme が Basic でないと false", () => {
      expect(
        isAuthorizedByPassword({
          authorizationHeader: "Bearer abc",
          password: "secret",
        }),
      ).toBe(false);
    });

    test("base64 が壊れていると false", () => {
      expect(
        isAuthorizedByPassword({
          authorizationHeader: "Basic ***",
          password: "secret",
        }),
      ).toBe(false);
    });

    test("コロン区切りが無いと false", () => {
      const token = Buffer.from("usersecret").toString("base64");

      expect(
        isAuthorizedByPassword({
          authorizationHeader: `Basic ${token}`,
          password: "secret",
        }),
      ).toBe(false);
    });

    test("password が不一致なら false", () => {
      const token = Buffer.from("user:wrong").toString("base64");

      expect(
        isAuthorizedByPassword({
          authorizationHeader: `Basic ${token}`,
          password: "secret",
        }),
      ).toBe(false);
    });
  });
});

