const MERCARI_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?jp\.mercari\.com\/[^\s)]+/gi;

const trimTrailingPunctuation = (value: string) => {
  return value.replace(/[.,!?。！？]+$/g, "");
};

const normalizeMercariUrl = (raw: string) => {
  const normalized = trimTrailingPunctuation(raw);
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return `https://${normalized}`;
};

export const extractMercariItemUrl = (input: {
  title: string;
  body: string;
}): string | null => {
  const source = `${input.title}\n${input.body}`;
  const hits = source.match(MERCARI_URL_REGEX) ?? [];
  for (const hit of hits) {
    const url = normalizeMercariUrl(hit);
    if (url.includes("/item/")) {
      return url;
    }
  }
  return null;
};

export const buildMercariSearchUrl = (keyword: string) => {
  const trimmed = keyword.trim();
  return `https://jp.mercari.com/search?keyword=${encodeURIComponent(trimmed)}`;
};

export const resolveMercariLink = (input: {
  title: string;
  body: string;
}): {
  href: string;
  type: "item" | "search";
} => {
  const itemUrl = extractMercariItemUrl(input);
  if (itemUrl) {
    return {
      href: itemUrl,
      type: "item",
    };
  }

  return {
    href: buildMercariSearchUrl(input.title),
    type: "search",
  };
};
