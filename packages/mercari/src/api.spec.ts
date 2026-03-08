import { describe, expect, test, vi } from "vitest";
import { createMercariApiClient } from "./api";

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });

describe("createMercariApiClient", () => {
  test("searchSoldItems: sold_out 条件で entities:search を呼び出す", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse({
        meta: {
          nextPageToken: "",
        },
        items: [
          {
            id: "m1",
            status: "ITEM_STATUS_SOLD_OUT",
            name: "PlayStation 5 CFI-2000",
            price: "50000",
          },
        ],
      }),
    );
    const nextUuid = vi
      .fn()
      .mockReturnValueOnce("search-session-id")
      .mockReturnValueOnce("laplace-device-uuid")
      .mockReturnValue("jti-id");

    const client = createMercariApiClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      nextUuid,
    });

    const result = await client.searchSoldItems({
      keyword: "PS5 CFI-2000",
      pageSize: 10,
      maxPages: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(requestUrl).toBe("https://api.mercari.jp/v2/entities:search");

    const headers = requestInit.headers as Record<string, string>;
    expect(headers["x-platform"]).toBe("web");
    expect(headers["x-country-code"]).toBe("JP");
    expect(headers.dpop.split(".")).toHaveLength(3);

    const body = JSON.parse(String(requestInit.body)) as {
      searchCondition: {
        status: string[];
        itemTypes: string[];
      };
    };
    expect(body.searchCondition.status).toEqual(["STATUS_SOLD_OUT"]);
    expect(body.searchCondition.itemTypes).toEqual(["ITEM_TYPE_MERCARI"]);
  });

  test("searchSoldItems: nextPageToken がある場合はページングする", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          meta: {
            nextPageToken: "v1:1",
          },
          items: [
            {
              id: "m1",
              status: "ITEM_STATUS_SOLD_OUT",
              name: "first",
              price: "1000",
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          meta: {
            nextPageToken: "",
          },
          items: [
            {
              id: "m2",
              status: "ITEM_STATUS_SOLD_OUT",
              name: "second",
              price: "2000",
            },
          ],
        }),
      );

    const client = createMercariApiClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.searchSoldItems({
      keyword: "PS5 CFI-2000",
      maxPages: 3,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.pageCount).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(["m1", "m2"]);
  });

  test("searchSoldItems: API エラー時はメッセージ付きで失敗する", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          code: 16,
          message: "unauthorized: missing auth token",
        },
        401,
      ),
    );

    const client = createMercariApiClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.searchSoldItems({
        keyword: "PS5 CFI-2000",
      }),
    ).rejects.toThrow("status=401");
  });

  test("searchSoldItems: 429/5xx は retry して成功できる", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse(
          {
            code: 14,
            message: "temporary unavailable",
          },
          503,
        ),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          meta: {
            nextPageToken: "",
          },
          items: [
            {
              id: "m1",
              status: "ITEM_STATUS_SOLD_OUT",
              name: "PlayStation 5 CFI-2000",
              price: "50000",
            },
          ],
        }),
      );

    const client = createMercariApiClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxRetries: 1,
      retryBaseDelayMs: 1,
    });

    const result = await client.searchSoldItems({
      keyword: "PS5 CFI-2000",
      maxPages: 1,
    });

    expect(result.items).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
