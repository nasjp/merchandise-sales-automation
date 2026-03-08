import { describe, expect, test } from "vitest";
import { POST } from "./route";

describe("POST /api/ui-auth/logout", () => {
  test("303 で unlock へ遷移し cookie を削除する", async () => {
    const response = await POST(
      new Request("https://example.com/api/ui-auth/logout", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/unlock");
    expect(response.headers.get("set-cookie")).toContain("msa_ui_password=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
