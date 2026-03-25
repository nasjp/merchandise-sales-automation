const json = (payload: Record<string, unknown>) => JSON.stringify(payload, null, 2);

export const aiPrompts = {
  explainOutlier: (payload: Record<string, unknown>): string => [
    "## タスク: 異常価格の理由説明",
    "",
    "以下のデータを分析し、価格が異常である理由を日本語で簡潔に説明してください。",
    "DBにアクセスして関連する price_snapshots, targets の情報も参照してください。",
    "",
    `入力データ: ${json(payload)}`,
    "",
    "### 結果フォーマット:",
    "```json",
    '{"status": "success", "summary": "理由の説明", "factors": [...], "confidence": 0.0-1.0}',
    "```",
  ].join("\n"),

  extractListingAttributes: (payload: Record<string, unknown>): string => [
    "## タスク: 商品情報からの属性抽出",
    "",
    "メルカリ商品情報から以下の属性を JSON で抽出してください:",
    "- modelText: 型番",
    "- condition: 状態",
    "- shipping: 送料形式",
    "- priceYenHint: 価格ヒント",
    "- confidence: 信頼度 (0.0-1.0)",
    "",
    `タイトル: ${payload.title ?? ""}`,
    `本文: ${payload.body ?? ""}`,
    "",
    "### 結果フォーマット:",
    "```json",
    '{"status": "success", "modelText": "...", "condition": "...", "shipping": "...", "priceYenHint": N, "confidence": 0.0-1.0}',
    "```",
  ].join("\n"),
};
