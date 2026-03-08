import {
  conditionKeywordMap,
  junkKeywords,
  shippingKeywordMap,
} from "./dictionaries";

export type MercariCondition = "new" | "used_good" | "used_fair" | "junk" | "unknown";
export type MercariShipping = "seller" | "buyer" | "unknown";

export type ParsedMercariNotification = {
  combinedText: string;
  listingTitle: string;
  priceYen: number | null;
  modelText: string | null;
  condition: MercariCondition;
  shipping: MercariShipping;
  isJunk: boolean;
};

const PRICE_WITH_YEN_REGEX = /([0-9]{1,3}(?:,[0-9]{3})+|[1-9][0-9]{3,7})\s*円/;
const PRICE_WITH_COMMA_REGEX = /([0-9]{1,3}(?:,[0-9]{3})+)/;
const MODEL_REGEX = /\b[A-Z]{1,5}-?\d{2,6}[A-Z0-9]{0,4}\b/i;

const includesAny = (source: string, words: readonly string[]) =>
  words.some((word) => source.includes(word.toLowerCase()));

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
  const model = source.match(MODEL_REGEX)?.[0];
  return model ? model.toUpperCase() : null;
};

const parseShipping = (sourceLower: string): MercariShipping => {
  if (includesAny(sourceLower, shippingKeywordMap.seller)) {
    return "seller";
  }
  if (includesAny(sourceLower, shippingKeywordMap.buyer)) {
    return "buyer";
  }
  return "unknown";
};

const parseCondition = (sourceLower: string): MercariCondition => {
  if (includesAny(sourceLower, junkKeywords)) {
    return "junk";
  }
  if (includesAny(sourceLower, conditionKeywordMap.new)) {
    return "new";
  }
  if (includesAny(sourceLower, conditionKeywordMap.usedGood)) {
    return "used_good";
  }
  if (includesAny(sourceLower, conditionKeywordMap.usedFair)) {
    return "used_fair";
  }
  return "unknown";
};

export const parseMercariNotification = (input: {
  title: string;
  body: string;
}): ParsedMercariNotification => {
  const combinedText = `${input.title} ${input.body}`.normalize("NFKC");
  const lower = combinedText.toLowerCase();
  const condition = parseCondition(lower);

  return {
    combinedText,
    listingTitle: input.title.normalize("NFKC"),
    priceYen: parsePriceYen(combinedText),
    modelText: parseModelText(combinedText),
    shipping: parseShipping(lower),
    condition,
    isJunk: condition === "junk",
  };
};
