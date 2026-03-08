import type {
  LlmProviderAdapter,
  LlmProviderRequest,
  LlmProviderResponse,
} from "../provider";
import type { ListingAttributes } from "../structuredOutput";

const PRICE_WITH_YEN_REGEX = /([0-9]{1,3}(?:,[0-9]{3})+|[1-9][0-9]{3,7})\s*円/;
const PRICE_WITH_COMMA_REGEX = /([0-9]{1,3}(?:,[0-9]{3})+)/;
const MODEL_REGEX = /\b[A-Z]{1,5}-?\d{2,6}[A-Z0-9]{0,4}\b/i;

const SELLER_SHIPPING_KEYWORDS = ["送料込み", "送料無料", "送料出品者負担"] as const;
const BUYER_SHIPPING_KEYWORDS = ["着払い", "送料購入者負担"] as const;
const JUNK_KEYWORDS = ["ジャンク", "junk", "難あり"] as const;
const NEW_KEYWORDS = ["新品", "未使用", "未開封"] as const;
const USED_GOOD_KEYWORDS = ["美品", "動作確認済", "状態良好"] as const;
const USED_FAIR_KEYWORDS = ["傷", "汚れ", "使用感"] as const;

const includesAny = (source: string, keywords: readonly string[]) =>
  keywords.some((keyword) => source.includes(keyword));

const parsePriceYen = (source: string): number | null => {
  const hit =
    source.match(PRICE_WITH_YEN_REGEX)?.[1] ??
    source.match(PRICE_WITH_COMMA_REGEX)?.[1];
  if (!hit) {
    return null;
  }

  const parsed = Number.parseInt(hit.replaceAll(",", ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseModelText = (source: string): string | null => {
  const hit = source.match(MODEL_REGEX)?.[0];
  return hit ? hit.toUpperCase() : null;
};

const parseAttributes = (title: string, body: string): ListingAttributes => {
  const combined = `${title} ${body}`.normalize("NFKC");
  const lower = combined.toLowerCase();
  const modelText = parseModelText(combined);
  const priceYenHint = parsePriceYen(combined);

  let condition: ListingAttributes["condition"] = "unknown";
  if (includesAny(lower, JUNK_KEYWORDS)) {
    condition = "junk";
  } else if (includesAny(lower, NEW_KEYWORDS)) {
    condition = "new";
  } else if (includesAny(lower, USED_GOOD_KEYWORDS)) {
    condition = "used_good";
  } else if (includesAny(lower, USED_FAIR_KEYWORDS)) {
    condition = "used_fair";
  }

  let shipping: ListingAttributes["shipping"] = "unknown";
  if (includesAny(lower, SELLER_SHIPPING_KEYWORDS)) {
    shipping = "seller";
  } else if (includesAny(lower, BUYER_SHIPPING_KEYWORDS)) {
    shipping = "buyer";
  }

  const confidence = modelText && priceYenHint ? 0.9 : modelText || priceYenHint ? 0.7 : 0.4;

  return {
    modelText,
    condition,
    shipping,
    priceYenHint,
    confidence,
  };
};

const parseMetadataField = (
  metadata: Record<string, unknown> | undefined,
  key: string,
): string => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
};

const generateResponse = async (
  input: LlmProviderRequest,
): Promise<LlmProviderResponse> => {
  const task = typeof input.metadata?.task === "string" ? input.metadata.task : "";

  if (task === "extractListingAttributes") {
    const title = parseMetadataField(input.metadata, "title");
    const body = parseMetadataField(input.metadata, "body");
    const attributes = parseAttributes(title, body);

    return {
      text: JSON.stringify(attributes),
      raw: {
        deterministic: true,
      },
    };
  }

  if (task === "explainOutlier") {
    return {
      text: "直近スナップショットとの価格差分が大きく、通知本文の状態語彙による補正が必要です。",
      raw: {
        deterministic: true,
      },
    };
  }

  return {
    text: "{}",
    raw: {
      deterministic: true,
    },
  };
};

export const createDeterministicProvider = (): LlmProviderAdapter => ({
  provider: "deterministic",
  generate: generateResponse,
});
