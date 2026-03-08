import { describe, expect, test } from "vitest";
import { formatDateTime } from "./format";

describe("formatDateTime", () => {
  test("UTC 時刻を JST で表示する", () => {
    const value = new Date("2026-03-08T13:37:39.000Z");
    expect(formatDateTime(value)).toBe("2026/03/08 22:37:39");
  });
});
