export const junkKeywords = [
  "ジャンク",
  "junk",
  "動作未確認",
  "故障",
  "難あり",
  "訳あり",
  "現状渡し",
  "部品取り",
] as const;

export const conditionKeywordMap = {
  new: ["新品", "未使用", "未開封"],
  usedGood: ["美品", "目立った傷や汚れなし", "状態良好"],
  usedFair: ["やや傷や汚れあり", "傷や汚れあり", "使用感あり"],
} as const;

export const shippingKeywordMap = {
  seller: ["送料込み", "送料込", "送料無料"],
  buyer: ["着払い", "送料別"],
} as const;
