import type { LlmMessage } from "./provider";

export const EXTRACT_LISTING_ATTRIBUTES_PROMPT_VERSION =
  "extract-listing-attributes.v1";

export const buildExtractListingAttributesPrompt = (input: {
  title: string;
  body: string;
}): { messages: readonly LlmMessage[] } => {
  const messages: readonly LlmMessage[] = [
    {
      role: "system",
      content: [
        "あなたは中古販売通知の属性抽出エンジンです。",
        "必ず JSON オブジェクトのみを返してください。",
        "キーは modelText, condition, shipping, priceYenHint, confidence を使ってください。",
        "condition は new|used_good|used_fair|junk|unknown のいずれか。",
        "shipping は seller|buyer|unknown のいずれか。",
        "priceYenHint は整数円。取得できなければ null。",
        "modelText は型番文字列。取得できなければ null。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "title:",
        input.title,
        "body:",
        input.body,
      ].join("\n"),
    },
  ];

  return {
    messages,
  };
};
