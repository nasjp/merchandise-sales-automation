import { describe, expect, test } from "vitest";
import { POST } from "./route";

const withEnv = async (
  values: Partial<NodeJS.ProcessEnv>,
  run: () => Promise<void>,
) => {
  const env = process.env as Record<string, string | undefined>;
  const before = {
    VERCEL_ENV: env.VERCEL_ENV,
    NODE_ENV: env.NODE_ENV,
    PASSWORD: env.PASSWORD,
  };

  Object.assign(env, values);
  try {
    await run();
  } finally {
    env.VERCEL_ENV = before.VERCEL_ENV;
    env.NODE_ENV = before.NODE_ENV;
    env.PASSWORD = before.PASSWORD;
  }
};

const buildRequest = (params: { password: string; next: string }) =>
  new Request("https://example.com/api/ui-auth", {
    method: "POST",
    body: new URLSearchParams({
      password: params.password,
      next: params.next,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

describe("POST /api/ui-auth", () => {
  test("正常系: password が一致したら 303 で next へ遷移し cookie を設定する", async () => {
    await withEnv(
      {
        VERCEL_ENV: "production",
        PASSWORD: "secret",
      },
      async () => {
        const response = await POST(
          buildRequest({
            password: "secret",
            next: "/targets",
          }),
        );

        expect(response.status).toBe(303);
        expect(response.headers.get("location")).toBe("https://example.com/targets");
        expect(response.headers.get("set-cookie")).toContain("msa_ui_password=secret");
      },
    );
  });

  test("異常系: password が不一致なら 303 で unlock に戻す", async () => {
    await withEnv(
      {
        VERCEL_ENV: "production",
        PASSWORD: "secret",
      },
      async () => {
        const response = await POST(
          buildRequest({
            password: "wrong",
            next: "/targets",
          }),
        );

        expect(response.status).toBe(303);
        expect(response.headers.get("location")).toBe(
          "https://example.com/unlock?next=%2Ftargets&error=1",
        );
      },
    );
  });
});
