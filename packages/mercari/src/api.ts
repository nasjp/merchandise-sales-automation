import { createSign, generateKeyPairSync, randomUUID } from "node:crypto";

const MERCARI_API_BASE_URL = "https://api.mercari.jp";
const ENTITIES_SEARCH_PATH = "/v2/entities:search";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

type FetchLike = typeof fetch;

type MercariEntitiesSearchResponse = {
  meta?: {
    nextPageToken?: string;
  };
  items?: MercariSearchItem[];
};

export type MercariSearchItem = {
  id: string;
  status: string;
  name: string;
  price: string;
  created?: string;
  updated?: string;
  itemType?: string;
};

export type SearchSoldItemsResult = {
  items: MercariSearchItem[];
  pageCount: number;
  nextPageToken: string | null;
};

const base64UrlEncode = (input: string | Uint8Array) =>
  Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");

const createDpopJwt = (params: {
  privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"];
  publicJwk: {
    kty: string;
    crv: string;
    x: string;
    y: string;
  };
  htu: string;
  htm: "POST";
  uuid: string;
  now: Date;
  nextUuid: () => string;
}) => {
  const header = {
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: {
      kty: params.publicJwk.kty,
      crv: params.publicJwk.crv,
      x: params.publicJwk.x,
      y: params.publicJwk.y,
    },
  };
  const payload = {
    iat: Math.floor(params.now.getTime() / 1000),
    jti: params.nextUuid(),
    htu: params.htu,
    htm: params.htm,
    uuid: params.uuid,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = createSign("SHA256")
    .update(signingInput)
    .end()
    .sign({
      key: params.privateKey,
      dsaEncoding: "ieee-p1363",
    });

  return `${signingInput}.${base64UrlEncode(signature)}`;
};

const parseJsonResponse = async (
  response: Response,
): Promise<MercariEntitiesSearchResponse> => {
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `mercari entities:search failed: status=${response.status} body=${text.slice(0, 240)}`,
    );
  }

  try {
    return JSON.parse(text) as MercariEntitiesSearchResponse;
  } catch (error) {
    throw new Error(
      `mercari entities:search invalid json: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const sleep = async (ms: number) => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const withTimeoutSignal = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
};

export const createMercariApiClient = (options?: {
  baseUrl?: string;
  countryCode?: string;
  userAgent?: string;
  fetchImpl?: FetchLike;
  now?: () => Date;
  nextUuid?: () => string;
  requestTimeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}) => {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const now = options?.now ?? (() => new Date());
  const nextUuid = options?.nextUuid ?? randomUUID;
  const countryCode = options?.countryCode ?? "JP";
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  const baseUrl = options?.baseUrl ?? MERCARI_API_BASE_URL;
  const requestTimeoutMs = Math.max(1_000, options?.requestTimeoutMs ?? 8_000);
  const maxRetries = Math.max(0, options?.maxRetries ?? 2);
  const retryBaseDelayMs = Math.max(50, options?.retryBaseDelayMs ?? 300);

  const keyPair = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const exportedJwk = keyPair.publicKey.export({ format: "jwk" });
  if (
    !exportedJwk.kty ||
    !exportedJwk.crv ||
    !exportedJwk.x ||
    !exportedJwk.y
  ) {
    throw new Error("failed to export dpop public jwk");
  }
  const publicJwk = {
    kty: exportedJwk.kty,
    crv: exportedJwk.crv,
    x: exportedJwk.x,
    y: exportedJwk.y,
  };

  const postEntitiesSearch = async (params: {
    keyword: string;
    pageToken: string;
    pageSize: number;
    searchSessionId: string;
    laplaceDeviceUuid: string;
  }) => {
    const url = `${baseUrl}${ENTITIES_SEARCH_PATH}`;
    const dpop = createDpopJwt({
      privateKey: keyPair.privateKey,
      publicJwk,
      htu: url,
      htm: "POST",
      uuid: params.laplaceDeviceUuid,
      now: now(),
      nextUuid,
    });

    const body = {
      userId: "",
      config: {
        responseToggles: ["QUERY_SUGGESTION_WEB_1"],
      },
      pageSize: params.pageSize,
      pageToken: params.pageToken,
      searchSessionId: params.searchSessionId,
      source: "BaseSerp",
      indexRouting: "INDEX_ROUTING_UNSPECIFIED",
      thumbnailTypes: [],
      searchCondition: {
        keyword: params.keyword,
        excludeKeyword: "",
        sort: "SORT_CREATED_TIME",
        order: "ORDER_DESC",
        status: ["STATUS_SOLD_OUT"],
        sizeId: [],
        categoryId: [],
        brandId: [],
        sellerId: [],
        priceMin: 0,
        priceMax: 0,
        itemConditionId: [],
        shippingPayerId: [],
        shippingFromArea: [],
        shippingMethod: [],
        colorId: [],
        hasCoupon: false,
        attributes: [],
        itemTypes: ["ITEM_TYPE_MERCARI"],
        skuIds: [],
        shopIds: [],
        excludeShippingMethodIds: [],
      },
      serviceFrom: "suruga",
      withItemBrand: true,
      withItemSize: false,
      withItemPromotions: true,
      withItemSizes: true,
      withShopname: false,
      useDynamicAttribute: true,
      withSuggestedItems: true,
      withOfferPricePromotion: true,
      withProductSuggest: true,
      withParentProducts: false,
      withProductArticles: true,
      withSearchConditionId: false,
      withAuction: true,
      laplaceDeviceUuid: params.laplaceDeviceUuid,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const timeout = withTimeoutSignal(requestTimeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
            "x-platform": "web",
            "x-country-code": countryCode,
            "user-agent": userAgent,
            dpop,
          },
          body: JSON.stringify(body),
          signal: timeout.signal,
        });

        if (response.ok) {
          return await parseJsonResponse(response);
        }

        const errorText = await response.text();
        const retryable = isRetryableStatus(response.status);
        if (!retryable || attempt >= maxRetries) {
          throw new Error(
            `mercari entities:search failed: status=${response.status} body=${errorText.slice(0, 240)}`,
          );
        }
      } catch (error) {
        const retryableError = isAbortError(error) || error instanceof TypeError;
        if (!retryableError || attempt >= maxRetries) {
          throw error;
        }
        lastError = error;
      } finally {
        timeout.clear();
      }

      const delayMs = retryBaseDelayMs * (attempt + 1);
      await sleep(delayMs);
    }

    throw new Error(
      `mercari entities:search failed after retry: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    );
  };

  return {
    searchSoldItems: async (params: {
      keyword: string;
      pageSize?: number;
      maxPages?: number;
    }): Promise<SearchSoldItemsResult> => {
      const maxPages = Math.max(1, params.maxPages ?? 3);
      const pageSize = Math.max(1, Math.min(120, params.pageSize ?? 120));
      const searchSessionId = nextUuid().replaceAll("-", "");
      const laplaceDeviceUuid = nextUuid();

      let pageToken = "";
      let pageCount = 0;
      const items: MercariSearchItem[] = [];

      while (pageCount < maxPages) {
        const page = await postEntitiesSearch({
          keyword: params.keyword,
          pageToken,
          pageSize,
          searchSessionId,
          laplaceDeviceUuid,
        });

        const pageItems = page.items ?? [];
        items.push(...pageItems);
        pageCount += 1;

        const nextToken = page.meta?.nextPageToken?.trim() ?? "";
        if (!nextToken || nextToken === pageToken || pageItems.length === 0) {
          return {
            items,
            pageCount,
            nextPageToken: nextToken || null,
          };
        }

        pageToken = nextToken;
      }

      return {
        items,
        pageCount,
        nextPageToken: pageToken || null,
      };
    },
  };
};
