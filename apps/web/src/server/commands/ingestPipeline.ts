import {
  decideReviewState,
  matchTarget,
  scoreCandidate,
  type MatchTargetResult,
} from "@merchandise/domain";
import { repositoryLocator, type DB, type RawEvent, type Target } from "@merchandise/db";
import { parseMercariNotification } from "@merchandise/mercari";
import { getDb } from "@/server/db";
import {
  DEFAULT_LISTING_ATTRIBUTES_MODEL,
  DEFAULT_LISTING_ATTRIBUTES_PROVIDER,
  extractListingAttributesWithLlm,
} from "@/server/llm/extractListingAttributes";

const findMatchedTarget = (params: {
  rawEvent: RawEvent;
  targets: Target[];
  modelText: string | null;
}) => {
  const source = `${params.rawEvent.title} ${params.rawEvent.body}`;

  for (const target of params.targets) {
    const result = matchTarget({
      title: source,
      modelText: params.modelText,
      target: {
        id: target.id,
        titleKeyword: target.titleKeyword,
        modelKeyword: target.modelKeyword,
        isActive: target.isActive,
      },
    });

    if (result.matched && result.targetId) {
      return {
        target,
        match: result,
      };
    }
  }

  const fallback: MatchTargetResult = {
    matched: false,
    reason: "title_mismatch",
  };
  return {
    target: null,
    match: fallback,
  };
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const extractAttributesWithAudit = async (params: {
  db: DB;
  rawEvent: RawEvent;
}) => {
  try {
    const llmResult = await extractListingAttributesWithLlm({
      title: params.rawEvent.title,
      body: params.rawEvent.body,
    });

    await repositoryLocator.aiRuns.insert(params.db, {
      candidateId: null,
      taskName: "ai.extractListingAttributes",
      provider: llmResult.audit.provider,
      model: llmResult.audit.model,
      status: "success",
      input: {
        rawEventId: params.rawEvent.id,
        promptVersion: llmResult.audit.promptVersion,
        policy: llmResult.audit.policy,
      },
      output: {
        attributes: llmResult.attributes,
        attempts: llmResult.audit.attempts,
      },
      error: null,
      executedAt: llmResult.audit.finishedAt,
    });

    return {
      status: "success" as const,
      attributes: llmResult.attributes,
    };
  } catch (error) {
    const message = toErrorMessage(error);

    await repositoryLocator.aiRuns.insert(params.db, {
      candidateId: null,
      taskName: "ai.extractListingAttributes",
      provider: DEFAULT_LISTING_ATTRIBUTES_PROVIDER,
      model: DEFAULT_LISTING_ATTRIBUTES_MODEL,
      status: "failed",
      input: {
        rawEventId: params.rawEvent.id,
      },
      output: {},
      error: message,
      executedAt: new Date(),
    });

    return {
      status: "failed" as const,
      attributes: null,
      error: message,
    };
  }
};

export const generateCandidateFromRawEvent = async (rawEventId: string) => {
  const db = getDb();
  const rawEvent = await repositoryLocator.rawEvents.findById(db, rawEventId);
  if (!rawEvent) {
    throw new Error(`raw event not found: ${rawEventId}`);
  }

  const existing = await repositoryLocator.candidates.findByRawEventId(db, rawEvent.id);
  if (existing) {
    return existing;
  }

  const targets = await repositoryLocator.targets.findActive(db);
  const parsed = parseMercariNotification({
    title: rawEvent.title,
    body: rawEvent.body,
  });
  const llm = await extractAttributesWithAudit({
    db,
    rawEvent,
  });
  const modelText = llm.attributes?.modelText ?? parsed.modelText;
  const listingPriceYen = parsed.priceYen ?? llm.attributes?.priceYenHint ?? 0;
  const condition = parsed.condition === "unknown" ? llm.attributes?.condition ?? "unknown" : parsed.condition;
  const shipping = parsed.shipping === "unknown" ? llm.attributes?.shipping ?? "unknown" : parsed.shipping;

  const matched = findMatchedTarget({
    rawEvent,
    targets,
    modelText,
  });

  const snapshot = matched.target
    ? await repositoryLocator.snapshots.findLatestByTargetId(db, matched.target.id)
    : null;

  const buyLimitYen = snapshot?.buyLimitYen ?? 0;
  const liquidityScore = snapshot?.liquidityScore ?? 0;
  const expectedProfitYen = (snapshot?.sellEstimateYen ?? 0) - listingPriceYen;

  const score = scoreCandidate({
    listingPriceYen,
    buyLimitYen,
    liquidityScore,
  });

  const reviewState = decideReviewState({
    score,
    expectedProfitYen,
  });

  const reasonParts = [
    `match:${matched.match.reason}`,
    `llm:${llm.status}`,
    snapshot ? "snapshot:available" : "snapshot:missing",
    parsed.priceYen
      ? "price:parsed"
      : llm.attributes?.priceYenHint
        ? "price:llm_hint"
        : "price:missing",
    `condition:${condition}`,
    `shipping:${shipping}`,
    `junk:${parsed.isJunk}`,
  ];

  const candidate = await repositoryLocator.candidates.insert(db, {
    rawEventId: rawEvent.id,
    targetId: matched.target?.id ?? null,
    listingTitle: parsed.listingTitle,
    listingPriceYen,
    matchedModel: modelText ?? matched.target?.modelKeyword ?? null,
    score,
    reviewState,
    reason: reasonParts.join(","),
  });

  await repositoryLocator.rawEvents.markProcessed(db, {
    id: rawEvent.id,
  });

  return candidate;
};
